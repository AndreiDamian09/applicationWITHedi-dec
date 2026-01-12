const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const register = (email, password, firstName, lastName, role) => {
  return apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      role,
    }),
  });
};

export const login = (email, password) => {
  return apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

// Student endpoints
export const getStudentSessions = () => {
  return apiCall("/student/sessions");
};

export const getStudentRequests = () => {
  return apiCall("/student/requests");
};

export const submitRequest = (sessionId, dissertationTitle) => {
  return apiCall("/student/requests", {
    method: "POST",
    body: JSON.stringify({ sessionId, dissertationTitle }),
  });
};

// Professor endpoints
export const getProfessorSessions = () => {
  return apiCall("/professor/sessions");
};

export const createSession = (
  title,
  description,
  startDate,
  endDate,
  maxStudents
) => {
  return apiCall("/professor/sessions", {
    method: "POST",
    body: JSON.stringify({
      title,
      description,
      startDate,
      endDate,
      maxStudents,
    }),
  });
};

export const getSessionRequests = (sessionId) => {
  return apiCall(`/professor/sessions/${sessionId}/requests`);
};

export const approveRequest = (requestId) => {
  return apiCall(`/professor/requests/${requestId}/approve`, {
    method: "PUT",
  });
};

export const rejectRequest = (requestId, rejectionReason) => {
  return apiCall(`/professor/requests/${requestId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ rejectionReason }),
  });
};
