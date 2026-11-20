import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaChartLine, FaBriefcase, FaGraduationCap, FaUpload, 
         FaUserGraduate, FaList, FaCode, FaClipboardList, FaBuilding, FaUser,
         FaUsers, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { cvService } from '../services/api';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [cv, setCV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Kullanıcının CV'sini getir
        try {
          const cvResponse = await cvService.getUserCV();
          setCV(cvResponse.data.cv);
        } catch (err) {
          if (err.response?.status !== 404) {
            throw err;
          }
        }
      } catch (err) {
        setError('Veri yüklenirken hata oluştu: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Veriler yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Dashboard</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Hoşgeldin Kartı */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Hoş Geldiniz, {currentUser?.first_name}!</Card.Title>
          <Card.Text>
            Scorely platformunda profilinizi güncelleyebilir, CV'nizi yükleyebilir ve kariyerinizde ilerlemenize yardımcı olacak özellikleri kullanabilirsiniz.
          </Card.Text>
        </Card.Body>
      </Card>
      
      {/* Koordinatör İşlemleri */}
      {(currentUser?.role === 'university_coordinator' || currentUser?.role === 'admin') && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Koordinatör İşlemleri</Card.Title>
            <Row className="mt-3">
              <Col md={4} lg={3} className="mb-3">
                <Link to="/coordinator" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-warning">
                        <FaChartLine size={40} />
                      </div>
                      <Card.Title>Genel Bakış</Card.Title>
                      <Card.Text>
                        İstatistikler ve genel durum bilgisi
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/coordinator/cvs" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-primary">
                        <FaList size={40} />
                      </div>
                      <Card.Title>CV Listesi</Card.Title>
                      <Card.Text>
                        Tüm CV'leri görüntüleyin ve değerlendirin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/coordinator/program-codes" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-info">
                        <FaCode size={40} />
                      </div>
                      <Card.Title>Program Kodları</Card.Title>
                      <Card.Text>
                        Staj programları oluşturun ve yönetin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/coordinator/applications" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-success">
                        <FaBriefcase size={40} />
                      </div>
                      <Card.Title>Staj Başvuruları</Card.Title>
                      <Card.Text>
                        Öğrenci başvurularını görüntüleyin ve değerlendirin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/coordinator/companies" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-secondary">
                        <FaBuilding size={40} />
                      </div>
                      <Card.Title>Staj Şirketleri</Card.Title>
                      <Card.Text>
                        Staj şirketlerini yönetin ve düzenleyin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/coordinator/placements" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-danger">
                        <FaUserGraduate size={40} />
                      </div>
                      <Card.Title>Yerleştirme Yönetimi</Card.Title>
                      <Card.Text>
                        Öğrenci yerleştirmelerini yönetin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* Admin İşlemleri */}
      {currentUser?.role === 'admin' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Yönetici İşlemleri</Card.Title>
            <Row className="mt-3">
              <Col md={6} className="mb-3">
                <Link to="/admin/users" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-dark">
                        <FaUser size={40} />
                      </div>
                      <Card.Title>Kullanıcı Yönetimi</Card.Title>
                      <Card.Text>
                        Sistem kullanıcılarını yönetin ve düzenleyin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* Öğrenci İşlemleri */}
      {currentUser?.role === 'student' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Öğrenci İşlemleri</Card.Title>
            <Row className="mt-3">
              <Col md={4} className="mb-3">
                <Link to="/cv-management" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-primary">
                        <FaFileAlt size={40} />
                      </div>
                      <Card.Title>CV Yönetimi</Card.Title>
                      <Card.Text>
                        CV'nizi yükleyin, görüntüleyin ve analiz edin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} className="mb-3">
                <Link to="/internship-application" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-success">
                        <FaGraduationCap size={40} />
                      </div>
                      <Card.Title>Staj Başvurusu</Card.Title>
                      <Card.Text>
                        Program kodunu kullanarak staj başvurusunda bulunun
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} className="mb-3">
                <Link to="/company-preferences" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-info">
                        <FaBuilding size={40} />
                      </div>
                      <Card.Title>Şirket Tercihleri</Card.Title>
                      <Card.Text>
                        Staj için şirket tercihlerinizi belirleyin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* İşveren İşlemleri */}
      {currentUser?.role === 'employer' && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title>Şirket İşlemleri</Card.Title>
            <Row className="mt-3">
              <Col md={4} lg={3} className="mb-3">
                <Link to="/employer" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-primary">
                        <FaChartLine size={40} />
                      </div>
                      <Card.Title>Dashboard</Card.Title>
                      <Card.Text>
                        Genel bakış ve istatistikler
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/employer/students" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-info">
                        <FaUserGraduate size={40} />
                      </div>
                      <Card.Title>Stajyer Yönetimi</Card.Title>
                      <Card.Text>
                        Stajyerleri görüntüleyin ve onaylayın
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/employer/mentors" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-success">
                        <FaUsers size={40} />
                      </div>
                      <Card.Title>Mentor Yönetimi</Card.Title>
                      <Card.Text>
                        Mentorları yönetin ve atayın
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
              <Col md={4} lg={3} className="mb-3">
                <Link to="/employer/profile" className="text-decoration-none">
                  <Card className="h-100 text-center clickable-card">
                    <Card.Body className="d-flex flex-column justify-content-center">
                      <div className="mb-3 text-warning">
                        <FaBuilding size={40} />
                      </div>
                      <Card.Title>Şirket Profili</Card.Title>
                      <Card.Text>
                        Şirket bilgilerinizi güncelleyin
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* CV Durumu - Tüm kullanıcılar için */}
      <Card>
        <Card.Body>
          <Card.Title>
            <FaFileAlt className="me-2" /> 
            CV Durumu
          </Card.Title>
          
          {cv ? (
            <div>
              <p className="mb-3">
                CV'niz yüklenmiş durumda: <strong>{cv.original_filename}</strong>
              </p>
              <div className="mt-3">
                <Link to="/cv-management">
                  <Button variant="primary">CV Yönetimi</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p>Henüz bir CV yüklenmemiş.</p>
              <Link to="/cv-management">
                <Button variant="primary">
                  <FaUpload className="me-2" />
                  CV Yükle
                </Button>
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Hızlı Erişim - Tüm kullanıcılar için ortak linkler */}
      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Hızlı Erişim</Card.Title>
          <Row className="mt-3">
            <Col xs={6} md={3} className="mb-2">
              <Link to="/profile" className="btn btn-outline-primary w-100">
                <FaUser className="me-2" />
                Profil
              </Link>
            </Col>
            <Col xs={6} md={3} className="mb-2">
              <Link to="/cv-management" className="btn btn-outline-primary w-100">
                <FaFileAlt className="me-2" />
                CV Yönetimi
              </Link>
            </Col>
            <Col xs={6} md={3} className="mb-2">
              <Link to="/" className="btn btn-outline-secondary w-100">
                Ana Sayfa
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Dashboard;