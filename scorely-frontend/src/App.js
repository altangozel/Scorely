// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout Components
import NavigationBar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import CVManagement from './pages/CVManagement';
import NotFound from './pages/NotFound';

// Koordinatör Sayfaları
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorCVList from './pages/coordinator/CoordinatorCVList';
import CoordinatorCVDetail from './pages/coordinator/CoordinatorCVDetail';
import ProgramCodes from './pages/coordinator/ProgramCodes';
import ApplicationList from './pages/coordinator/ApplicationList';
import CompanyManagement from './pages/coordinator/CompanyManagement';
import PlacementManagement from './pages/coordinator/PlacementManagement';
import CoordinatorMessages from './pages/coordinator/CoordinatorMessages';

// Öğrenci Sayfaları
import InternshipApplication from './pages/student/InternshipApplication';
import CompanyPreferences from './pages/student/CompanyPreferences';

// İşveren Sayfaları
import EmployerDashboard from './pages/employer/EmployerDashboard';
import StudentList from './pages/employer/studentList';
import MentorManagement from './pages/employer/MentorManagement';
import DepartmentManagement from './pages/employer/DepartmentManagement';
import Messages from './pages/employer/Messages';
import CompanyProfile from './pages/employer/CompanyProfile';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();
  
  if (loading) {
    return <div>Yükleniyor...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Eğer rol kontrolü varsa, kontrolü yap
  if (roles && !roles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Router>
      <NavigationBar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/cv-management" element={
            <ProtectedRoute>
              <CVManagement />
            </ProtectedRoute>
          } />
          
          {/* Koordinatör Rotaları */}
          <Route path="/coordinator" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <CoordinatorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/coordinator/cvs" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <CoordinatorCVList />
            </ProtectedRoute>
          } />
          
          <Route path="/coordinator/cv/:id" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <CoordinatorCVDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/coordinator/program-codes" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <ProgramCodes />
            </ProtectedRoute>
          } />
          
          <Route path="/coordinator/applications" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <ApplicationList />
            </ProtectedRoute>
          } />
          
          <Route path="/coordinator/companies" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <CompanyManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/coordinator/placements" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <PlacementManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/coordinator/messages" element={
            <ProtectedRoute roles={['university_coordinator', 'admin']}>
              <CoordinatorMessages />
            </ProtectedRoute>
          } />
          
          {/* Öğrenci Rotaları */}
          <Route path="/internship-application" element={
            <ProtectedRoute roles={['student']}>
              <InternshipApplication />
            </ProtectedRoute>
          } />
          
          <Route path="/company-preferences" element={
            <ProtectedRoute roles={['student']}>
              <CompanyPreferences />
            </ProtectedRoute>
          } />
          
          {/* İşveren Rotaları */}
          <Route path="/employer" element={
            <ProtectedRoute roles={['employer']}>
              <EmployerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/employer/students" element={
            <ProtectedRoute roles={['employer']}>
              <StudentList />
            </ProtectedRoute>
          } />
          
          <Route path="/employer/mentors" element={
            <ProtectedRoute roles={['employer']}>
              <MentorManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/employer/departments" element={
            <ProtectedRoute roles={['employer']}>
              <DepartmentManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/employer/messages" element={
            <ProtectedRoute roles={['employer']}>
              <Messages />
            </ProtectedRoute>
          } />
          
          <Route path="/employer/profile" element={
            <ProtectedRoute roles={['employer']}>
              <CompanyProfile />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <div className="d-flex flex-column min-vh-100">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;