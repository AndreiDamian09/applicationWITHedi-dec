/**
 * Auth Page Component
 * Combined Login and Register with toggle functionality
 * Modern design with role selection for registration
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginUser, register as registerUser } from "../utils/api";
import "../styles/auth.css";

export default function Auth() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;
      if (isSignup) {
        response = await registerUser(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          formData.role
        );
      } else {
        response = await loginUser(formData.email, formData.password);
      }
      
      login(response.user, response.token);
      navigate(
        response.user.role === "professor"
          ? "/professor/dashboard"
          : "/student/dashboard"
      );
    } catch (err) {
      setError(err.message || "Autentificarea a eșuat");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError("");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <h1>Sistem Disertații</h1>
            <p>{isSignup ? "Creează un cont nou" : "Autentifică-te în cont"}</p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="name-row">
                <div className="form-group">
                  <label htmlFor="firstName">Prenume</label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Ion"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Nume</label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Popescu"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemplu@universitate.ro"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Parolă</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            {isSignup && (
              <div className="form-group">
                <label>Rol</label>
                <div className="role-selector">
                  <button
                    type="button"
                    className={`role-button ${formData.role === "student" ? "active" : ""}`}
                    onClick={() => handleRoleSelect("student")}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    className={`role-button ${formData.role === "professor" ? "active" : ""}`}
                    onClick={() => handleRoleSelect("professor")}
                  >
                    Profesor
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-error">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? "Se procesează..."
                : isSignup
                ? "Creează cont"
                : "Autentificare"}
            </button>
          </form>

          {/* Toggle */}
          <div className="auth-toggle">
            <button type="button" className="auth-toggle-btn" onClick={toggleMode}>
              {isSignup
                ? "Ai deja cont? Autentifică-te"
                : "Nu ai cont? Înregistrează-te"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
