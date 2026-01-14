const API_BASE_URL =
 "https://alene-acanthine-ironically.ngrok-free.dev/api";

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

export const updateSession = (
  sessionId,
  title,
  description,
  startDate,
  endDate,
  maxStudents
) => {
  return apiCall(`/professor/sessions/${sessionId}`, {
    method: "PUT",
    body: JSON.stringify({
      title,
      description,
      startDate,
      endDate,
      maxStudents,
    }),
  });
};

export const deleteSession = (sessionId) => {
  return apiCall(`/professor/sessions/${sessionId}`, {
    method: "DELETE",
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

/**
 * Upload signed coordination request file (student)
 * @param {number} requestId - The request ID
 * @param {File} file - The PDF file to upload
 */
export const uploadSignedFile = async (requestId, file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("signedFile", file);

  const response = await fetch(
    `${API_BASE_URL}/student/requests/${requestId}/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Upload professor response file
 * @param {number} requestId - The request ID
 * @param {File} file - The PDF file to upload
 */
export const uploadProfessorResponse = async (requestId, file) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("professorFile", file);

  const response = await fetch(
    `${API_BASE_URL}/professor/requests/${requestId}/upload-response`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Request file reupload from student
 * @param {number} requestId - The request ID
 * @param {string} reason - Reason for requesting reupload
 */
export const requestReupload = (requestId, reason) => {
  return apiCall(`/professor/requests/${requestId}/request-reupload`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  });
};

/**
 * Get all requests for professor
 */
export const getAllProfessorRequests = () => {
  return apiCall("/professor/requests");
};

/**
 * Get file download URL
 * @param {string} filename - The filename
 */
export const getFileUrl = (filename) => {
  return `${API_BASE_URL.replace("/api", "")}/uploads/${filename}`;
};

/**
 * Get template PDF download URL
 */
export const getTemplateUrl = () => {
  return `${API_BASE_URL.replace("/api", "")}/templates/cerere-coordonare.pdf`;
};
