// src/services/api.js
import axios from 'axios';

// .env'den API URL'sini al veya varsayılan değeri kullan
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 hataları için
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth servisleri
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile')
};

// CV servisleri
export const cvService = {
  uploadCV: (formData) => {
    return api.post('/cv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getUserCV: () => api.get('/cv/my-cv'),
  analyzeCV: () => api.get('/cv/analyze'),
  reanalyzeCV: () => api.post('/cv/reanalyze'),
  deleteCV: () => api.delete('/cv/delete'),
  downloadCV: (id) => api.get(`/cv/download/${id}`, { responseType: 'blob' })
};

// Koordinatör servisleri
export const coordinatorService = {
  getAllCVs: (params) => api.get('/coordinator/cvs', { params }),
  getCVDetails: (id) => api.get(`/coordinator/cvs/${id}`),
  tagCV: (id, data) => api.put(`/coordinator/cvs/${id}/tag`, data),
  getStatistics: () => api.get('/coordinator/statistics'),
  getTopCVs: (limit = 10) => api.get('/coordinator/top-cvs', { params: { limit } }),
  deleteCV: (id) => api.delete(`/coordinator/cvs/${id}`)
};

// Program kodu servisleri
export const programCodeService = {
  getAllProgramCodes: () => api.get('/program-codes'),
  createProgramCode: (data) => api.post('/program-codes/create', data),
  toggleProgramCode: (id) => api.put(`/program-codes/${id}/toggle`),
  validateProgramCode: (code) => api.post('/program-codes/validate', { code })
};

// Staj başvuru servisleri
export const internshipService = {
  applyForInternship: (data) => api.post('/internships/apply', data),
  getMyApplications: () => api.get('/internships/my-applications'),
  getProgramApplications: (params) => api.get('/internships/applications', { params }),
  updateApplicationStatus: (id, data) => api.put(`/internships/applications/${id}/status`, data),
  revokeApproval: (id) => api.post(`/internships/applications/${id}/revoke`),
  withdrawApplication: (id) => api.delete(`/internships/applications/${id}/withdraw`)
};

// GPA servisleri
export const userService = {
  updateGPA: (data) => api.put('/users/update-gpa', data),
  updateStudentGPA: (userId, data) => api.put(`/users/coordinator/update-student-gpa/${userId}`, data)
};

// Staj şirketi servisleri
export const companyService = {
  getAll: (params) => api.get('/companies/coordinator/all', { params }),
  add: (data) => api.post('/companies/coordinator/add', data),
  update: (id, data) => api.put(`/companies/coordinator/${id}`, data),
  delete: (id) => api.delete(`/companies/coordinator/${id}`),
  getAvailableForStudent: (params) => api.get('/companies/student/available', { params }),
  getCompanyMentorInfo: (companyName) => api.get('/companies/coordinator/mentor-info', { params: { company_name: companyName } })
};

// Yerleştirme servisleri
export const placementService = {
  savePreferences: (data) => api.post('/placements/student/save-preferences', data),
  getResults: (params) => api.get('/placements/student/results', { params }),
  getPlacementsForCoordinator: (params) => api.get('/placements/coordinator/all', { params }),
  calculatePlacements: (data) => api.post('/placements/coordinator/calculate', data),
  toggleVisibility: (data) => api.post('/placements/coordinator/toggle-visibility', data)
};

// Mesaj servisleri
export const messageService = {
  // Koordinatör için
  getAvailableMentors: () => api.get('/messages/coordinator/mentors'),
  sendMessageFromCoordinator: (data) => api.post('/messages/coordinator/send', data),
  getMessagesForCoordinator: (params) => api.get('/messages/coordinator/list', { params }),
  markMessageAsRead: (id) => api.put(`/messages/coordinator/read/${id}`)
};

// Employer (İşveren) servisleri
export const employerService = {
  // Profil
  getCompanyProfile: () => api.get('/employer/profile'),
  updateCompanyProfile: (data) => api.put('/employer/profile', data),
  
  // Dashboard
  getDashboardSummary: () => api.get('/employer/dashboard/summary'),
  
  // Öğrenci yönetimi
  getAssignedStudents: (params) => api.get('/employer/students', { params }),
  updateStudentApproval: (placementId, data) => api.put(`/employer/students/${placementId}/approval`, data),
  
  // Departman yönetimi
  manageDepartments: (data) => api.post('/employer/departments', data),
  
  // Mentor yönetimi
  manageMentors: (data) => api.post('/employer/mentors', data),
  
  // Mesajlaşma
  getMessages: (params) => api.get('/employer/messages', { params }),
  sendMessage: (data) => api.post('/employer/messages', data)
};

// Transkript servisleri
export const transcriptService = {
  uploadTranscript: (studentId, formData) => {
    return api.post(`/transcripts/upload${studentId ? `/${studentId}` : ''}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getStudentTranscripts: (studentId) => api.get(`/transcripts/student/${studentId || 'me'}`),
  getMyTranscripts: () => api.get('/transcripts/my-transcripts'),
  downloadTranscript: (id) => `${API_URL}/transcripts/download/${id}`,
  verifyTranscript: (id, data) => api.put(`/transcripts/verify/${id}`, data)
};

export default api;