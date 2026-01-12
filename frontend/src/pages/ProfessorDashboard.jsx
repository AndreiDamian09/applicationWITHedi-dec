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
  updateSession,
  deleteSession,
  getSessionRequests,
  approveRequest,
  rejectRequest,
  uploadProfessorResponse,
  requestReupload,
  getFileUrl,
} from "../utils/api";
import "../styles/dashboard.css";
import LogoASE from "../assets/Logo_ASE.png";

export default function ProfessorDashboard() {
  const [sessions, setSessions] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [reuploadModal, setReuploadModal] = useState(null);
  const [reuploadReason, setReuploadReason] = useState("");
  const [uploadingFile, setUploadingFile] = useState(null);

  // Popup states
  const [popup, setPopup] = useState({ show: false, type: 'info', message: '' });
  const [confirmPopup, setConfirmPopup] = useState({ show: false, message: '', onConfirm: null });
  const [deleteSessionId, setDeleteSessionId] = useState(null);

  const showPopup = (message, type = 'error') => {
    setPopup({ show: true, type, message });
  };

  const closePopup = () => {
    setPopup({ show: false, type: 'info', message: '' });
  };

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
      if (editingSession) {
        await updateSession(
          editingSession.id,
          sessionForm.title,
          sessionForm.description,
          sessionForm.startDate,
          sessionForm.endDate,
          sessionForm.maxStudents
        );
        setEditingSession(null);
      } else {
        await createSession(
          sessionForm.title,
          sessionForm.description,
          sessionForm.startDate,
          sessionForm.endDate,
          sessionForm.maxStudents
        );
      }
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
      showPopup("Eroare: " + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      title: session.title,
      description: session.description || "",
      startDate: new Date(session.startDate).toISOString().split("T")[0],
      endDate: new Date(session.endDate).toISOString().split("T")[0],
      maxStudents: session.maxStudents,
    });
    setShowCreateModal(true);
  };

  const handleDeleteSession = (sessionId) => {
    setDeleteSessionId(sessionId);
    setConfirmPopup({
      show: true,
      message: "Ești sigur că vrei să ștergi această sesiune? Toate cererile asociate vor fi șterse.",
      onConfirm: async () => {
        try {
          setProcessing(true);
          await deleteSession(sessionId);
          fetchData();
        } catch (err) {
          showPopup("Eroare: " + err.message, 'error');
        } finally {
          setProcessing(false);
          setConfirmPopup({ show: false, message: '', onConfirm: null });
          setDeleteSessionId(null);
        }
      }
    });
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessing(true);
      await approveRequest(requestId);
      fetchData();
    } catch (err) {
      showPopup("Eroare: " + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      showPopup("Te rugăm să introduci un motiv pentru respingere", 'warning');
      return;
    }
    try {
      setProcessing(true);
      await rejectRequest(selectedRequest.id, rejectionReason);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchData();
    } catch (err) {
      showPopup("Eroare: " + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleUploadResponse = async (requestId, file) => {
    if (!file) return;
    
    try {
      setUploadingFile(requestId);
      await uploadProfessorResponse(requestId, file);
      fetchData();
    } catch (err) {
      showPopup("Eroare la încărcarea fișierului: " + err.message, 'error');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleRequestReupload = async () => {
    if (!reuploadModal || !reuploadReason.trim()) {
      showPopup("Te rugăm să introduci un motiv pentru reupload", 'warning');
      return;
    }
    try {
      setProcessing(true);
      await requestReupload(reuploadModal.id, reuploadReason);
      setReuploadModal(null);
      setReuploadReason("");
      fetchData();
    } catch (err) {
      showPopup("Eroare: " + err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const pendingRequests = allRequests.filter((r) => r.status === "pending");
  const approvedRequests = allRequests.filter((r) => r.status === "approved");
  const waitingReuploadRequests = allRequests.filter((r) => r.status === "waiting_for_reupload");

  // Verifică dacă există o sesiune activă (deschisă)
  const now = new Date();
  const hasActiveSession = sessions.some((session) => {
    const startDate = new Date(session.startDate);
    const endDate = new Date(session.endDate);
    return now >= startDate && now <= endDate;
  });

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
            <img src={LogoASE} alt="Logo ASE" className="header-logo" />
            <div>
              <h1>Dashboard Profesor</h1>
              <p>{user?.firstName} {user?.lastName}</p>
            </div>
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
            <button 
              className={`btn ${hasActiveSession ? 'btn-disabled' : 'btn-primary'}`} 
              onClick={() => !hasActiveSession && setShowCreateModal(true)}
              disabled={hasActiveSession}
              title={hasActiveSession ? 'Ai deja o sesiune activă. Nu poți crea o sesiune nouă.' : 'Creează o sesiune nouă'}
            >
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
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
                      <div className="item-card-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditSession(session)}
                          title="Editează sesiunea"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={session.approvedCount > 0 || processing}
                          title={session.approvedCount > 0 ? "Nu poți șterge sesiuni cu studenți acceptați" : "Șterge sesiunea"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
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
                      
                      {/* Student's signed file */}
                      {request.signedCoordinationRequestFile ? (
                        <div className="file-uploaded">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <a href={getFileUrl(request.signedCoordinationRequestFile)} target="_blank" rel="noopener noreferrer">
                            Cerere semnată de student
                          </a>
                        </div>
                      ) : (
                        <p className="text-muted">Studentul nu a încărcat încă cererea semnată</p>
                      )}

                      {/* Professor's response file */}
                      {request.professorReviewFile && (
                        <div className="file-uploaded professor-file">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <a href={getFileUrl(request.professorReviewFile)} target="_blank" rel="noopener noreferrer">
                            Răspunsul tău
                          </a>
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

                  {/* Actions for approved requests with student file */}
                  {request.signedCoordinationRequestFile && (
                    <div className="item-card-footer">
                      {/* Upload professor response */}
                      {!request.professorReviewFile && (
                        <div className="file-upload inline">
                          <label className="btn btn-outline btn-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            {uploadingFile === request.id ? "Se încarcă..." : "Încarcă răspuns"}
                            <input
                              type="file"
                              accept="application/pdf"
                              hidden
                              disabled={uploadingFile === request.id}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadResponse(request.id, file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                      
                      {/* Request reupload */}
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => setReuploadModal(request)}
                        disabled={processing}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        Cere reupload
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Waiting for Reupload Section */}
        {waitingReuploadRequests.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <h2>Așteptare reupload ({waitingReuploadRequests.length})</h2>
            </div>
            <div className="item-list">
              {waitingReuploadRequests.map((request) => (
                <div key={request.id} className="item-card">
                  <div className="item-card-header">
                    <div className="item-card-info">
                      <h3>{request.student.firstName} {request.student.lastName}</h3>
                      <p className="email">{request.student.email}</p>
                      {request.reuploadReason && (
                        <p className="message">Motiv: {request.reuploadReason}</p>
                      )}
                    </div>
                    <span className="status-badge warning">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Așteptare reupload
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Session Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingSession(null); }}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>{editingSession ? "Editează sesiunea" : "Creează sesiune nouă"}</h3>
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
                      setEditingSession(null);
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
                    {processing ? "Se procesează..." : (editingSession ? "Salvează modificările" : "Creează sesiune")}
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

        {/* Reupload Request Modal */}
        {reuploadModal && (
          <div className="modal-overlay" onClick={() => setReuploadModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Cere reupload fișier</h3>
              <div className="modal-info">
                <p>
                  Student: <strong>{reuploadModal.student.firstName} {reuploadModal.student.lastName}</strong>
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="reuploadReason">Motiv reupload (obligatoriu)</label>
                <textarea
                  id="reuploadReason"
                  value={reuploadReason}
                  onChange={(e) => setReuploadReason(e.target.value)}
                  placeholder="Explică de ce studentul trebuie să încarce din nou fișierul..."
                  rows={4}
                  style={{ resize: "none" }}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setReuploadModal(null);
                    setReuploadReason("");
                  }}
                >
                  Anulează
                </button>
                <button
                  className="btn btn-warning"
                  onClick={handleRequestReupload}
                  disabled={!reuploadReason.trim() || processing}
                >
                  {processing ? "Se procesează..." : "Cere reupload"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup Message Modal */}
        {popup.show && (
          <div className="modal-overlay" onClick={closePopup}>
            <div className="modal popup-modal" onClick={(e) => e.stopPropagation()}>
              <div className={`popup-icon ${popup.type}`}>
                {popup.type === 'error' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                {popup.type === 'warning' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {popup.type === 'success' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
                {popup.type === 'info' && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>
              <p className="popup-message">{popup.message}</p>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={closePopup}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Popup Modal */}
        {confirmPopup.show && (
          <div className="modal-overlay">
            <div className="modal popup-modal" onClick={(e) => e.stopPropagation()}>
              <div className="popup-icon warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p className="popup-message">{confirmPopup.message}</p>
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setConfirmPopup({ show: false, message: '', onConfirm: null });
                    setDeleteSessionId(null);
                  }}
                >
                  Anulează
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={confirmPopup.onConfirm}
                  disabled={processing}
                >
                  {processing ? "Se procesează..." : "Da, șterge"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2026 Toate drepturile rezervate - Chisega Eduard și Buzatoiu Andrei</p>
      </footer>
    </div>
  );
}
