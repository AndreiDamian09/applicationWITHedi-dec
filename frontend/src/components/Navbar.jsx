/**
 * Navbar Component
 * Simple and clean navigation bar
 */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>Sistem Disertații</h1>
        </div>
        <div className="navbar-content">
          {user && (
            <>
              <span className="user-info">
                <strong>{user.firstName} {user.lastName}</strong> ({user.role === "professor" ? "Profesor" : "Student"})
              </span>
              <button onClick={handleLogout} className="btn-logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Ieșire
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
