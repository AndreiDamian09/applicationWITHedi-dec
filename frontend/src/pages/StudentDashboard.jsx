/**
 * Student Dashboard Component
 * Displays available sessions and student's requests
 * Modern design with status badges and file upload
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getStudentSessions,
  submitRequest,
  getStudentRequests,
  uploadSignedFile,
  getFileUrl,
  getTemplateUrl,
} from "../utils/api";
import "../styles/dashboard.css";
import LogoASE from "../assets/Logo_ASE.png";

export default function StudentDashboard() {
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("requests");
  const [submitModal, setSubmitModal] = useState(null);
  const [dissertationTitle, setDissertationTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const handleSubmitRequest = async () => {
    if (!submitModal) return;
    
    try {
      setSubmitting(true);
      await submitRequest(submitModal, dissertationTitle);
      setSubmitModal(null);
      setDissertationTitle("");
      fetchData();
    } catch (err) {
      alert("Eroare: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFileUpload = async (requestId, file) => {
    if (!file) return;
    
    try {
      setUploadingFile(requestId);
      await uploadSignedFile(requestId, file);
      fetchData();
    } catch (err) {
      alert("Eroare la încărcarea fișierului: " + err.message);
    } finally {
      setUploadingFile(null);
    }
  };

  const hasApprovedRequest = requests.some((r) => r.status === "approved");

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
              <h1>Dashboard Student</h1>
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

        {/* Success Alert */}
        {hasApprovedRequest && (
          <div className="alert-banner success">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p>Ai fost acceptat la disertație! Celelalte cereri au fost blocate automat.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-button ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Cererile mele
          </button>
          <button
            className={`tab-button ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            Sesiuni disponibile
          </button>
        </div>

        {/* My Requests Tab */}
        {activeTab === "requests" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Cererile mele</h2>
            </div>

            {requests.length === 0 ? (
              <div className="empty-state">
                <p>Nu ai trimis încă nicio cerere</p>
              </div>
            ) : (
              <div className="item-list">
                {requests.map((request) => (
                  <div key={request.id} className="item-card">
                    <div className="item-card-header">
                      <div className="item-card-info">
                        <h3>
                          {request.professor.firstName} {request.professor.lastName}
                        </h3>
                        <p className="email">{request.professor.email}</p>
                        {request.dissertationTitle && (
                          <p className="message">"{request.dissertationTitle}"</p>
                        )}
                        <p className="date">
                          Trimisă la {new Date(request.createdAt).toLocaleDateString("ro-RO")}
                        </p>
                      </div>
                      <div>
                        {request.status === "pending" && (
                          <span className="status-badge pending">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            În așteptare
                          </span>
                        )}
                        {request.status === "approved" && (
                          <span className="status-badge approved">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Aprobată
                          </span>
                        )}
                        {request.status === "rejected" && (
                          <span className="status-badge rejected">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            Respinsă
                          </span>
                        )}
                        {request.status === "waiting_for_reupload" && (
                          <span className="status-badge warning">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            Reupload necesar
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {request.status === "rejected" && request.rejectionReason && (
                      <div className="rejection-box">
                        <p>
                          <strong>Motiv respingere:</strong> {request.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Reupload reason */}
                    {request.status === "waiting_for_reupload" && request.reuploadReason && (
                      <div className="rejection-box warning">
                        <p>
                          <strong>Motiv reupload:</strong> {request.reuploadReason}
                        </p>
                      </div>
                    )}

                    {/* File upload for approved or waiting_for_reupload requests */}
                    {(request.status === "approved" || request.status === "waiting_for_reupload") && !request.signedCoordinationRequestFile && (
                      <div className="file-upload-section">
                        <div className="template-download">
                          <a 
                            href={getTemplateUrl()} 
                            download="cerere-coordonare.pdf" 
                            className="btn btn-outline btn-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Descarcă formularul
                          </a>
                        </div>
                        <div className="file-upload">
                          <label>Încarcă cererea semnată (PDF)</label>
                          <input
                            type="file"
                            accept="application/pdf"
                            disabled={uploadingFile === request.id}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(request.id, file);
                              }
                            }}
                          />
                          {uploadingFile === request.id && (
                            <span className="uploading">Se încarcă...</span>
                          )}
                        </div>
                      </div>
                    )}

                    {request.signedCoordinationRequestFile && (
                      <div className="file-uploaded">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <a href={getFileUrl(request.signedCoordinationRequestFile)} target="_blank" rel="noopener noreferrer">
                          Cerere semnată
                        </a>
                      </div>
                    )}

                    {/* Professor response file */}
                    {request.professorReviewFile && (
                      <div className="file-uploaded professor-file">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <a href={getFileUrl(request.professorReviewFile)} target="_blank" rel="noopener noreferrer">
                          Răspuns profesor
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Available Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="section-card">
            <div className="section-header">
              <h2>Sesiuni disponibile</h2>
            </div>

            {sessions.length === 0 ? (
              <div className="empty-state">
                <p>Nu există sesiuni active momentan</p>
              </div>
            ) : (
              <div className="session-grid">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="session-card"
                    onClick={() => !hasApprovedRequest && !session.studentRequestStatus && setSubmitModal(session.id)}
                  >
                    <h3>{session.title}</h3>
                    <p className="professor">
                      Profesor: {session.professor.firstName} {session.professor.lastName}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(session.startDate).toLocaleDateString("ro-RO")} - {new Date(session.endDate).toLocaleDateString("ro-RO")}
                    </p>
                    <div className="session-card-footer">
                      <span className="slots">
                        Locuri: {session.approvedCount}/{session.maxStudents}
                      </span>
                      {session.studentRequestStatus ? (
                        <span className={`status-badge ${session.studentRequestStatus}`}>
                          {session.studentRequestStatus === "pending" && "În așteptare"}
                          {session.studentRequestStatus === "approved" && "Aprobată"}
                          {session.studentRequestStatus === "rejected" && "Respinsă"}
                        </span>
                      ) : (
                        !hasApprovedRequest && session.availableSlots > 0 && (
                          <button
                            className="apply-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubmitModal(session.id);
                            }}
                          >
                            Aplică
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Request Modal */}
        {submitModal && (
          <div className="modal-overlay" onClick={() => setSubmitModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h3>Trimite cerere preliminară</h3>
              
              <div className="modal-info">
                {sessions.find((s) => s.id === submitModal) && (
                  <>
                    <p>
                      <strong>Sesiune:</strong> {sessions.find((s) => s.id === submitModal).title}
                    </p>
                    <p>
                      <strong>Profesor:</strong>{" "}
                      {sessions.find((s) => s.id === submitModal).professor.firstName}{" "}
                      {sessions.find((s) => s.id === submitModal).professor.lastName}
                    </p>
                  </>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="dissertationTitle">Titlu disertație (opțional)</label>
                <textarea
                  id="dissertationTitle"
                  value={dissertationTitle}
                  onChange={(e) => setDissertationTitle(e.target.value)}
                  placeholder="Introdu titlul propus pentru disertație..."
                  rows={3}
                  style={{ resize: "none" }}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSubmitModal(null);
                    setDissertationTitle("");
                  }}
                >
                  Anulează
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitRequest}
                  disabled={submitting}
                >
                  {submitting ? "Se trimite..." : "Trimite cerere"}
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
