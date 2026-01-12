import { useEffect, useState } from "react";
import {
  getStudentSessions,
  submitRequest,
  getStudentRequests,
} from "../utils/api";
import "../styles/dashboard.css";

export default function StudentDashboard() {
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("sessions");
  const [submitModal, setSubmitModal] = useState(null);
  const [dissertationTitle, setDissertationTitle] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionData, requestData] = await Promise.all([
        getStudentSessions(),
        getStudentRequests(),
      ]);
      setSessions(sessionData);
      setRequests(requestData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (sessionId) => {
    try {
      await submitRequest(sessionId, dissertationTitle);
      setSubmitModal(null);
      setDissertationTitle("");
      fetchData();
      alert("Request submitted successfully!");
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
        <h1>Student Dashboard</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            Available Sessions
          </button>
          <button
            className={`tab-button ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            My Requests
          </button>
        </div>

        {activeTab === "sessions" && (
          <div className="tab-content">
            <div className="grid">
              {sessions.map((session) => (
                <div key={session.id} className="card">
                  <div className="card-header">
                    <h3>{session.title}</h3>
                  </div>
                  <div className="card-body">
                    <p>
                      <strong>Professor:</strong> {session.professor.firstName}{" "}
                      {session.professor.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong> {session.professor.email}
                    </p>
                    <p>
                      <strong>Max Students:</strong> {session.maxStudents}
                    </p>
                    <p>
                      <strong>Available Slots:</strong> {session.availableSlots}
                    </p>
                    <p>
                      <strong>Period:</strong>{" "}
                      {new Date(session.startDate).toLocaleDateString()} -{" "}
                      {new Date(session.endDate).toLocaleDateString()}
                    </p>
                    {session.description && (
                      <p>
                        <strong>Description:</strong> {session.description}
                      </p>
                    )}

                    {session.studentRequestStatus ? (
                      <div
                        className={`status-badge ${session.studentRequestStatus}`}
                      >
                        Status: {session.studentRequestStatus.toUpperCase()}
                      </div>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => setSubmitModal(session.id)}
                        disabled={session.availableSlots <= 0}
                      >
                        {session.availableSlots <= 0
                          ? "Session Full"
                          : "Submit Request"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {sessions.length === 0 && (
              <p className="text-center">No available sessions at the moment</p>
            )}
          </div>
        )}

        {activeTab === "requests" && (
          <div className="tab-content">
            <table className="table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      {request.professor.firstName} {request.professor.lastName}
                    </td>
                    <td>{request.session.title}</td>
                    <td>
                      <span className={`status-badge ${request.status}`}>
                        {request.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <p className="text-center">No requests yet</p>
            )}
          </div>
        )}

        {submitModal && (
          <div className="modal-overlay" onClick={() => setSubmitModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Submit Dissertation Request</h2>
              <div className="form-group">
                <label>Dissertation Title</label>
                <input
                  type="text"
                  value={dissertationTitle}
                  onChange={(e) => setDissertationTitle(e.target.value)}
                  placeholder="Enter your dissertation title"
                />
              </div>
              <div className="modal-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => handleSubmitRequest(submitModal)}
                >
                  Submit
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSubmitModal(null)}
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
