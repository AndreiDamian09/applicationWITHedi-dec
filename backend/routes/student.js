const express = require("express");
const { verifyToken, isStudent } = require("../middleware/auth");
const { RegistrationSession, DissertationRequest, User } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

/**
 * Get all available registration sessions
 * GET /api/student/sessions
 */
router.get("/sessions", verifyToken, isStudent, async (req, res) => {
  try {
    const now = new Date();

    const sessions = await RegistrationSession.findAll({
      where: {
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now },
      },
      include: [
        {
          model: User,
          as: "professor",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
      order: [["startDate", "ASC"]],
    });

    // Add counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const approvedCount = await DissertationRequest.count({
          where: { sessionId: session.id, status: "approved" },
        });
        const studentRequest = await DissertationRequest.findOne({
          where: { sessionId: session.id, studentId: req.userId },
        });
        return {
          ...session.toJSON(),
          approvedCount,
          availableSlots: session.maxStudents - approvedCount,
          studentRequestStatus: studentRequest ? studentRequest.status : null,
          studentRequestId: studentRequest ? studentRequest.id : null,
        };
      })
    );

    res.json(sessionsWithCounts);
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ error: "Failed to retrieve sessions" });
  }
});

/**
 * Get all requests for a student
 * GET /api/student/requests
 */
router.get("/requests", verifyToken, isStudent, async (req, res) => {
  try {
    const requests = await DissertationRequest.findAll({
      where: { studentId: req.userId },
      include: [
        {
          model: User,
          as: "professor",
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
    console.error("Get requests error:", error);
    res.status(500).json({ error: "Failed to retrieve requests" });
  }
});

/**
 * Submit a preliminary dissertation request to a professor
 * POST /api/student/requests
 */
router.post("/requests", verifyToken, isStudent, async (req, res) => {
  try {
    const { sessionId, dissertationTitle } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Check if session exists and is valid
    const session = await RegistrationSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const now = new Date();
    if (session.startDate > now || session.endDate < now) {
      return res.status(400).json({ error: "Session is not active" });
    }

    // Check if student already has a pending request for this session
    const existingRequest = await DissertationRequest.findOne({
      where: {
        sessionId,
        studentId: req.userId,
        status: "pending",
      },
    });

    if (existingRequest) {
      return res.status(400).json({
        error: "You already have a pending request for this session",
      });
    }

    // Check if student already has an approved request with this professor
    const approvedRequest = await DissertationRequest.findOne({
      where: {
        studentId: req.userId,
        professorId: session.professorId,
        status: "approved",
      },
    });

    if (approvedRequest) {
      return res.status(400).json({
        error: "You are already approved by this professor",
      });
    }

    // Check if student is already approved by another professor
    const otherApproval = await DissertationRequest.findOne({
      where: {
        studentId: req.userId,
        status: "approved",
        professorId: { [Op.ne]: session.professorId },
      },
    });

    if (otherApproval) {
      return res.status(400).json({
        error: "You are already approved by another professor",
      });
    }

    // Check if session is full
    const approvedCount = await DissertationRequest.count({
      where: { sessionId, status: "approved" },
    });

    if (approvedCount >= session.maxStudents) {
      return res.status(400).json({ error: "Session is full" });
    }

    // Create request
    const request = await DissertationRequest.create({
      sessionId,
      studentId: req.userId,
      professorId: session.professorId,
      dissertationTitle: dissertationTitle || "",
    });

    res.status(201).json({
      message: "Request submitted successfully",
      request,
    });
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ error: "Failed to submit request" });
  }
});

/**
 * Get a specific request details
 * GET /api/student/requests/:requestId
 */
router.get("/requests/:requestId", verifyToken, isStudent, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await DissertationRequest.findOne({
      where: { id: requestId, studentId: req.userId },
      include: [
        {
          model: User,
          as: "professor",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Get request error:", error);
    res.status(500).json({ error: "Failed to retrieve request" });
  }
});

module.exports = router;
