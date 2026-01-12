/**
 * Professor Dashboard Component
 * Manage sessions, view and process student requests
 * Modern design with stats cards and organized sections
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Create session form
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    maxStudents: 5,
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const sessionsData = await getProfessorSessions();
      setSessions(sessionsData);
      
      // Fetch requests for all sessions
      const allReqs = [];
      for (const session of sessionsData) {
        try {
          const reqs = await getSessionRequests(session.id);
          allReqs.push(...reqs.map(r => ({ ...r, sessionTitle: session.title })));
        } catch (e) {
          console.error("Error fetching requests for session:", session.id);
        }
      }
      setAllRequests(allReqs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      await createSession(
        sessionForm.title,
        sessionForm.description,
        sessionForm.startDate,
        sessionForm.endDate,
        sessionForm.maxStudents
      );
      setShowCreateModal(false);
      setSessionForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        maxStudents: 5,
      });
      fetchData();
    } catch (err) {
      alert("Eroare: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessing(true);
      await approveRequest(requestId);
      fetchData();
    } catch (err) {
      alert("Eroare: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert("Te rugăm să introduci un motiv pentru respingere");
      return;
    }
    try {
      setProcessing(true);
      await rejectRequest(selectedRequest.id, rejectionReason);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchData();
    } catch (err) {
      alert("Eroare: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pendingRequests = allRequests.filter((r) => r.status === "pending");
  const approvedRequests = allRequests.filter((r) => r.status === "approved");

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-header-left">
            <h1>Dashboard Profesor</h1>
            <p>{user?.firstName} {user?.lastName}</p>
          </div>
          <div className="dashboard-header-right">
            <button className="logout-btn" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Ieșire
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p>Sesiuni active</p>
                <h3>{sessions.length}</h3>
              </div>
              <div className="stat-card-icon blue">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p>Cereri în așteptare</p>
                <h3>{pendingRequests.length}</h3>
              </div>
              <div className="stat-card-icon yellow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-info">
                <p>Studenți acceptați</p>
                <h3>{approvedRequests.length}</h3>
              </div>
              <div className="stat-card-icon green">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Section */}
        <div className="section-card">
          <div className="section-header">
            <h2>Sesiunile mele</h2>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Sesiune nouă
            </button>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>Nu ai creat încă nicio sesiune</p>
            </div>
          ) : (
            <div className="item-list">
              {sessions.map((session) => (
                <div key={session.id} className="item-card">
                  <div className="item-card-header">
                    <div className="item-card-info">
                      <h3>{session.title}</h3>
                      <p>
                        {new Date(session.startDate).toLocaleDateString("ro-RO")} - {new Date(session.endDate).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p className="font-medium">
                        {session.approvedCount}/{session.maxStudents} locuri
                      </p>
                      <div className="progress-bar" style={{ width: "6rem" }}>
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${(session.approvedCount / session.maxStudents) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests Section */}
        <div className="section-card">
          <div className="section-header">
            <h2>Cereri în așteptare ({pendingRequests.length})</h2>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <p>Nu există cereri în așteptare</p>
            </div>
          ) : (
            <div className="item-list">
              {pendingRequests.map((request) => (
                <div key={request.id} className="item-card">
                  <div className="item-card-header">
                    <div className="item-card-info">
                      <h3>{request.student.firstName} {request.student.lastName}</h3>
                      <p className="email">{request.student.email}</p>
                      {request.dissertationTitle && (
                        <p className="message">"{request.dissertationTitle}"</p>
                      )}
                      <p className="date">
                        Trimisă la {new Date(request.createdAt).toLocaleString("ro-RO")}
                      </p>
                    </div>
                    <div className="item-card-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={processing}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Aprobă
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setSelectedRequest(request)}
                        disabled={processing}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Respinge
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Students Section */}
        <div className="section-card">
          <div className="section-header">
            <h2>Studenți acceptați ({approvedRequests.length})</h2>
          </div>

          {approvedRequests.length === 0 ? (
            <div className="empty-state">
              <p>Nu ai acceptat încă niciun student</p>
            </div>
          ) : (
            <div className="item-list">
              {approvedRequests.map((request) => (
                <div key={request.id} className="item-card">
                  <div className="item-card-header">
                    <div className="item-card-info">
                      <h3>{request.student.firstName} {request.student.lastName}</h3>
                      <p className="email">{request.student.email}</p>
                      {request.signedCoordinationRequestFile && (
                        <div className="file-uploaded">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          Fișier încărcat de student
                        </div>
                      )}
                    </div>
                    <span className="status-badge approved">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Acceptat
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Session Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Creează sesiune nouă</h3>
              <form onSubmit={handleCreateSession}>
                <div className="form-group">
                  <label htmlFor="title">Nume sesiune</label>
                  <input
                    id="title"
                    type="text"
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    placeholder="ex: Sesiune Disertație 2025"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Descriere (opțional)</label>
                  <textarea
                    id="description"
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                    placeholder="Adaugă o descriere..."
                    rows={3}
                    style={{ resize: "none" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label htmlFor="startDate">Data început</label>
                    <input
                      id="startDate"
                      type="date"
                      value={sessionForm.startDate}
                      onChange={(e) => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">Data sfârșit</label>
                    <input
                      id="endDate"
                      type="date"
                      value={sessionForm.endDate}
                      onChange={(e) => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="maxStudents">Număr maxim de studenți</label>
                  <input
                    id="maxStudents"
                    type="number"
                    min="1"
                    value={sessionForm.maxStudents}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxStudents: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSessionForm({
                        title: "",
                        description: "",
                        startDate: "",
                        endDate: "",
                        maxStudents: 5,
                      });
                    }}
                  >
                    Anulează
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={processing}>
                    {processing ? "Se creează..." : "Creează sesiune"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {selectedRequest && (
          <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Respinge cererea</h3>
              <div className="modal-info">
                <p>
                  Student: <strong>{selectedRequest.student.firstName} {selectedRequest.student.lastName}</strong>
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="rejectionReason">Motiv respingere (obligatoriu)</label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explică motivul respingerii..."
                  rows={4}
                  style={{ resize: "none" }}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedRequest(null);
                    setRejectionReason("");
                  }}
                >
                  Anulează
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || processing}
                >
                  {processing ? "Se procesează..." : "Respinge cererea"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
