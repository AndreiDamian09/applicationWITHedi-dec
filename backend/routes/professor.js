const express = require("express");
const { verifyToken, isProfessor } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { RegistrationSession, DissertationRequest, User } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

/**
 * Create a new registration session
 * POST /api/professor/sessions
 */
router.post("/sessions", verifyToken, isProfessor, async (req, res) => {
  try {
    const { title, description, startDate, endDate, maxStudents } = req.body;

    // Validate input
    if (!title || !startDate || !endDate || !maxStudents) {
      return res.status(400).json({ error: "Title, startDate, endDate, and maxStudents are required" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({ error: "Start date must be before end date" });
    }

    // Note: Overlapping sessions are now allowed for the same professor

    // Create session
    const session = await RegistrationSession.create({
      professorId: req.userId,
      title,
      description: description || "",
      startDate: start,
      endDate: end,
      maxStudents,
    });

    res.status(201).json({
      message: "Session created successfully",
      session,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

/**
 * Get all sessions for the professor
 * GET /api/professor/sessions
 */
router.get("/sessions", verifyToken, isProfessor, async (req, res) => {
  try {
    const sessions = await RegistrationSession.findAll({
      where: { professorId: req.userId },
      include: [
        {
          model: DissertationRequest,
          as: "requests",
          attributes: ["id", "status"],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    // Add count of approved students
    const sessionsWithCounts = sessions.map((session) => {
      const approvedCount = session.requests.filter((r) => r.status === "approved").length;
      return {
        ...session.toJSON(),
        approvedCount,
        availableSlots: session.maxStudents - approvedCount,
      };
    });

    res.json(sessionsWithCounts);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to retrieve sessions" });
  }
});

/**
 * Update a registration session
 * PUT /api/professor/sessions/:sessionId
 */
router.put("/sessions/:sessionId", verifyToken, isProfessor, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, description, startDate, endDate, maxStudents } = req.body;

    const session = await RegistrationSession.findOne({
      where: { id: sessionId, professorId: req.userId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if there are approved students - can't reduce maxStudents below current approved count
    const approvedCount = await DissertationRequest.count({
      where: { sessionId, status: "approved" },
    });

    if (maxStudents && maxStudents < approvedCount) {
      return res.status(400).json({
        error: `Cannot set maxStudents below current approved count (${approvedCount})`,
      });
    }

    // Validate dates if provided
    const newStart = startDate ? new Date(startDate) : session.startDate;
    const newEnd = endDate ? new Date(endDate) : session.endDate;

    if (newStart >= newEnd) {
      return res.status(400).json({ error: "Start date must be before end date" });
    }

    // Update session
    await session.update({
      title: title || session.title,
      description: description !== undefined ? description : session.description,
      startDate: newStart,
      endDate: newEnd,
      maxStudents: maxStudents || session.maxStudents,
    });

    res.json({
      message: "Session updated successfully",
      session,
    });
  } catch (error) {
    console.error("Update session error:", error);
    res.status(500).json({ error: "Failed to update session" });
  }
});

/**
 * Delete a registration session
 * DELETE /api/professor/sessions/:sessionId
 */
router.delete("/sessions/:sessionId", verifyToken, isProfessor, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await RegistrationSession.findOne({
      where: { id: sessionId, professorId: req.userId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Check if there are approved students
    const approvedCount = await DissertationRequest.count({
      where: { sessionId, status: "approved" },
    });

    if (approvedCount > 0) {
      return res.status(400).json({
        error: `Cannot delete session with approved students (${approvedCount} approved)`,
      });
    }

    // Delete all pending requests first
    await DissertationRequest.destroy({
      where: { sessionId },
    });

    // Delete session
    await session.destroy();

    res.json({
      message: "Session deleted successfully",
    });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

/**
 * Get all requests for a session
 * GET /api/professor/sessions/:sessionId/requests
 */
router.get("/sessions/:sessionId/requests", verifyToken, isProfessor, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify the session belongs to the professor
    const session = await RegistrationSession.findOne({
      where: { id: sessionId, professorId: req.userId },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const requests = await DissertationRequest.findAll({
      where: { sessionId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(requests);
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ error: "Failed to retrieve requests" });
  }
});

/**
 * Approve a dissertation request
 * PUT /api/professor/requests/:requestId/approve
 */
router.put("/requests/:requestId/approve", verifyToken, isProfessor, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await DissertationRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify ownership
    if (request.professorId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Can only approve pending requests" });
    }

    // Check if session has available slots
    const session = await RegistrationSession.findByPk(request.sessionId);
    const approvedCount = await DissertationRequest.count({
      where: { sessionId: request.sessionId, status: "approved" },
    });

    if (approvedCount >= session.maxStudents) {
      return res.status(400).json({ error: "Session is full" });
    }

    // Check if student is already approved by another professor
    const existingApproval = await DissertationRequest.findOne({
      where: {
        studentId: request.studentId,
        status: "approved",
        professorId: { [Op.ne]: req.userId },
      },
    });

    if (existingApproval) {
      return res.status(400).json({
        error: "Student is already approved by another professor",
      });
    }

    // Approve request
    request.status = "approved";
    await request.save();

    // Auto-delete all other pending requests from this student
    const deletedCount = await DissertationRequest.destroy({
      where: {
        studentId: request.studentId,
        id: { [Op.ne]: request.id },
        status: "pending",
      },
    });

    res.json({
      message: `Request approved. ${deletedCount} other pending requests were automatically removed.`,
      request,
      deletedRequestsCount: deletedCount,
    });
  } catch (error) {
    console.error("Approve request error:", error);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

/**
 * Reject a dissertation request
 * PUT /api/professor/requests/:requestId/reject
 */
router.put("/requests/:requestId/reject", verifyToken, isProfessor, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const request = await DissertationRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify ownership
    if (request.professorId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "Can only reject pending requests" });
    }

    // Reject request
    request.status = "rejected";
    request.rejectionReason = rejectionReason;
    await request.save();

    res.json({
      message: "Request rejected",
      request,
    });
  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

/**
 * Request file reupload from student
 * PUT /api/professor/requests/:requestId/request-reupload
 * Body: { reason } - explanation why reupload is needed
 */
router.put("/requests/:requestId/request-reupload", verifyToken, isProfessor, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Reason for reupload request is required" });
    }

    const request = await DissertationRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify ownership
    if (request.professorId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Can only request reupload for approved requests with a signed file
    if (request.status !== "approved" || !request.signedCoordinationRequestFile) {
      return res.status(400).json({ 
        error: "Can only request reupload for approved requests with uploaded files" 
      });
    }

    // Update status to waiting_for_reupload
    request.status = "waiting_for_reupload";
    request.reuploadReason = reason;
    request.signedCoordinationRequestFile = null; // Clear the old file
    await request.save();

    res.json({
      message: "Reupload requested successfully",
      request,
    });
  } catch (error) {
    console.error("Request reupload error:", error);
    res.status(500).json({ error: "Failed to request reupload" });
  }
});

/**
 * Upload professor review/response file
 * POST /api/professor/requests/:requestId/upload-response
 * File: professorFile (PDF)
 */
router.post("/requests/:requestId/upload-response", verifyToken, isProfessor, upload.single("professorFile"), async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    const request = await DissertationRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify ownership
    if (request.professorId !== req.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Can only upload response for approved requests with student's signed file
    if (request.status !== "approved" || !request.signedCoordinationRequestFile) {
      return res.status(400).json({ 
        error: "Can only upload response after student has uploaded signed request" 
      });
    }

    // Save file path
    request.professorReviewFile = req.file.filename;
    await request.save();

    res.json({
      message: "Response file uploaded successfully",
      request,
    });
  } catch (error) {
    console.error("Upload response error:", error);
    res.status(500).json({ error: "Failed to upload response file" });
  }
});

/**
 * Get all requests for the professor (across all sessions)
 * GET /api/professor/requests
 */
router.get("/requests", verifyToken, isProfessor, async (req, res) => {
  try {
    const requests = await DissertationRequest.findAll({
      where: { professorId: req.userId },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "email", "firstName", "lastName"],
        },
        {
          model: RegistrationSession,
          as: "session",
          attributes: ["id", "title", "startDate", "endDate"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(requests);
  } catch (error) {
    console.error("Get all requests error:", error);
    res.status(500).json({ error: "Failed to retrieve requests" });
  }
});

module.exports = router;
