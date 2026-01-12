const express = require("express");
const { verifyToken, isProfessor } = require("../middleware/auth");
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

    // Check for overlapping sessions
    const overlappingSession = await RegistrationSession.findOne({
      where: {
        professorId: req.userId,
        isActive: true,
        [Op.or]: [
          { startDate: { [Op.lt]: end }, endDate: { [Op.gt]: start } },
        ],
      },
    });

    if (overlappingSession) {
      return res.status(400).json({
        error: "Cannot create session: overlaps with existing session",
      });
    }

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

    res.json({
      message: "Request approved",
      request,
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

module.exports = router;
