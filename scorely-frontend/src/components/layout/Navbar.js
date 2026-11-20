// src/components/layout/Navbar.js
import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUser, FaSignOutAlt, FaFileAlt, FaCode, FaGraduationCap, 
  FaBriefcase, FaChartBar, FaBuilding, FaUserGraduate, FaUsers,
  FaEnvelope, FaHome, FaUserTie
} from 'react-icons/fa';

const NavigationBar = () => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo.png"
            width="30"
            height="30"
            className="d-inline-block align-top me-2"
            alt="Scorely Logo"
          />
          Scorely
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Ana Sayfa</Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/cv-management">CV Yönetimi</Nav.Link>
                
                {/* Koordinatör Menüsü */}
                {currentUser?.role === 'university_coordinator' && (
                  <NavDropdown title="Koordinatör Paneli" id="coordinator-dropdown">
                    <NavDropdown.Item as={Link} to="/coordinator">
                      <FaChartBar className="me-2" /> Genel Bakış
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/coordinator/cvs">
                      <FaFileAlt className="me-2" /> CV Listesi
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/coordinator/program-codes">
                      <FaCode className="me-2" /> Program Kodları
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/coordinator/applications">
                      <FaBriefcase className="me-2" /> Staj Başvuruları
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/coordinator/companies">
                      <FaBuilding className="me-2" /> Staj Şirketleri
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/coordinator/placements">
                      <FaUserGraduate className="me-2" /> Yerleştirme Yönetimi
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/coordinator/messages">
                      <FaEnvelope className="me-2" /> Mesajlar
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {/* Öğrenci Menüsü */}
                {currentUser?.role === 'student' && (
                  <>
                    <Nav.Link as={Link} to="/internship-application">
                      <FaGraduationCap className="me-1" /> Staj Başvurusu
                    </Nav.Link>
                    <Nav.Link as={Link} to="/company-preferences">
                      <FaBuilding className="me-1" /> Şirket Tercihleri
                    </Nav.Link>
                  </>
                )}
                
                {/* İşveren Menüsü */}
                {currentUser?.role === 'employer' && (
                  <NavDropdown title="Şirket Paneli" id="employer-dropdown">
                    <NavDropdown.Item as={Link} to="/employer">
                      <FaHome className="me-2" /> Ana Sayfa
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/employer/students">
                      <FaUserGraduate className="me-2" /> Stajyer Listesi
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/employer/mentors">
                      <FaUserTie className="me-2" /> Mentor Yönetimi
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/employer/departments">
                      <FaBuilding className="me-2" /> Departmanlar
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/employer/messages">
                      <FaEnvelope className="me-2" /> Mesajlar
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/employer/profile">
                      <FaBuilding className="me-2" /> Şirket Profili
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
                
                {/* Admin Menüsü */}
                {currentUser?.role === 'admin' && (
                  <NavDropdown title="Yönetim Paneli" id="admin-dropdown">
                    <NavDropdown.Item as={Link} to="/coordinator">
                      <FaChartBar className="me-2" /> Koordinatör Paneli
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/users">
                      <FaUser className="me-2" /> Kullanıcı Yönetimi
                    </NavDropdown.Item>
                  </NavDropdown>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {!isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/login">Giriş Yap</Nav.Link>
                <Nav.Link as={Link} to="/register">Kayıt Ol</Nav.Link>
              </>
            ) : (
              <NavDropdown 
                title={
                  <span>
                    <FaUser className="me-1" />
                    {currentUser.first_name} {currentUser.last_name}
                  </span>
                } 
                id="user-dropdown"
              >
                <NavDropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" /> Profil
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/cv-management">
                  <FaFileAlt className="me-2" /> CV Yönetimi
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Çıkış Yap
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;