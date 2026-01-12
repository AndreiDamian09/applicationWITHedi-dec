import { useEffect, useState } from "react";
import {
  getProfessorSessions,
  createSession,
  getSessionRequests,
  approveRequest,
  rejectRequest,
} from "../utils/api";
import "../styles/dashboard.css";

export default function ProfessorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("sessions");
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionRequests, setSessionRequests] = useState([]);
  const [createModal, setCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    maxStudents: 5,
  });
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getProfessorSessions();
      setSessions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!formData.title || !formData.startDate || !formData.endDate) {
        alert("Please fill in all required fields");
        return;
      }
      await createSession(
        formData.title,
        formData.description,
        formData.startDate,
        formData.endDate,
        formData.maxStudents
      );
      setCreateModal(false);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        maxStudents: 5,
      });
      fetchSessions();
      alert("Session created successfully!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleSelectSession = async (session) => {
    try {
      const requests = await getSessionRequests(session.id);
      setSessionRequests(requests);
      setSelectedSession(session);
    } catch (err) {
      alert("Error loading requests: " + err.message);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await approveRequest(requestId);
      handleSelectSession(selectedSession);
      alert("Request approved!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectionReason.trim()) {
        alert("Please provide a rejection reason");
        return;
      }
      await rejectRequest(rejectionModal, rejectionReason);
      setRejectionModal(null);
      setRejectionReason("");
      handleSelectSession(selectedSession);
      alert("Request rejected!");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="dashboard">
      <div className="container">
        <h1>Professor Dashboard</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            My Sessions
          </button>
        </div>

        {activeTab === "sessions" && (
          <div className="tab-content">
            <button
              className="btn btn-primary mb-2"
              onClick={() => setCreateModal(true)}
            >
              Create New Session
            </button>

            {selectedSession ? (
              <div className="session-detail">
                <button
                  className="btn btn-secondary mb-2"
                  onClick={() => setSelectedSession(null)}
                >
                  Back to Sessions
                </button>
                <div className="card">
                  <div className="card-header">
                    <h2>{selectedSession.title}</h2>
                  </div>
                  <div className="card-body">
                    <p>
                      <strong>Max Students:</strong>{" "}
                      {selectedSession.maxStudents}
                    </p>
                    <p>
                      <strong>Approved:</strong> {selectedSession.approvedCount}
                    </p>
                    <p>
                      <strong>Available Slots:</strong>{" "}
                      {selectedSession.availableSlots}
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <h3>Requests</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionRequests.map((req) => (
                        <tr key={req.id}>
                          <td>
                            {req.student.firstName} {req.student.lastName}
                          </td>
                          <td>{req.student.email}</td>
                          <td>
                            <span className={`status-badge ${req.status}`}>
                              {req.status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {req.status === "pending" && (
                              <>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleApprove(req.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => setRejectionModal(req.id)}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {sessionRequests.length === 0 && (
                    <p>No requests for this session</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="card"
                    onClick={() => handleSelectSession(session)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card-header">
                      <h3>{session.title}</h3>
                    </div>
                    <div className="card-body">
                      <p>
                        <strong>Period:</strong>{" "}
                        {new Date(session.startDate).toLocaleDateString()} -{" "}
                        {new Date(session.endDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Max Students:</strong> {session.maxStudents}
                      </p>
                      <p>
                        <strong>Approved:</strong> {session.approvedCount}
                      </p>
                      <p>
                        <strong>Available Slots:</strong>{" "}
                        {session.availableSlots}
                      </p>
                      <p
                        className="text-center"
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginTop: "10px",
                        }}
                      >
                        Click to view requests
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {sessions.length === 0 && !selectedSession && (
              <p className="text-center">No sessions created yet</p>
            )}
          </div>
        )}

        {createModal && (
          <div className="modal-overlay" onClick={() => setCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create New Session</h2>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Session title"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Session description"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Students</label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxStudents: parseInt(e.target.value),
                    })
                  }
                  min="1"
                />
              </div>
              <div className="modal-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleCreateSession}
                >
                  Create
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectionModal && (
          <div
            className="modal-overlay"
            onClick={() => setRejectionModal(null)}
          >
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Reject Request</h2>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejection"
                  rows="4"
                />
              </div>
              <div className="modal-buttons">
                <button className="btn btn-danger" onClick={handleReject}>
                  Reject
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setRejectionModal(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
