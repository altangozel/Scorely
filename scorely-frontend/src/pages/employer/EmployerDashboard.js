import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaUserGraduate, FaClock, FaCheckCircle, FaTimesCircle, 
  FaUsers, FaBuilding, FaEnvelope, FaChartBar 
} from 'react-icons/fa';
import { employerService } from '../../services/api';

const EmployerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await employerService.getDashboardSummary();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Dashboard veri yükleme hatası:', err);
      setError('Dashboard verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Dashboard yükleniyor...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Şirket Dashboard</h2>
      
      {/* İstatistik Kartları */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="text-center h-100">
            <Card.Body>
              <div className="display-4 text-primary mb-2">
                {stats?.totalStudents || 0}
              </div>
              <Card.Title>Toplam Stajyer</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 border-warning">
            <Card.Body>
              <div className="display-4 text-warning mb-2">
                {stats?.pendingApprovals || 0}
              </div>
              <Card.Title>Onay Bekleyen</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 border-success">
            <Card.Body>
              <div className="display-4 text-success mb-2">
                {stats?.approvedStudents || 0}
              </div>
              <Card.Title>Onaylanan</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="text-center h-100 border-danger">
            <Card.Body>
              <div className="display-4 text-danger mb-2">
                {stats?.rejectedStudents || 0}
              </div>
              <Card.Title>Reddedilen</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Hızlı Erişim Butonları */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Hızlı İşlemler</Card.Title>
          <Row className="mt-3">
            <Col md={4} lg={3} className="mb-3">
              <Link to="/employer/students" className="text-decoration-none">
                <Card className="h-100 text-center clickable-card">
                  <Card.Body>
                    <div className="mb-3 text-primary">
                      <FaUserGraduate size={40} />
                    </div>
                    <Card.Title>Stajyer Listesi</Card.Title>
                    <Card.Text>
                      Onay bekleyen ve onaylanan stajyerleri görüntüleyin
                    </Card.Text>
                    {stats?.pendingApprovals > 0 && (
                      <Badge bg="warning" className="position-absolute top-0 end-0 m-2">
                        {stats.pendingApprovals}
                      </Badge>
                    )}
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            
            <Col md={4} lg={3} className="mb-3">
              <Link to="/employer/mentors" className="text-decoration-none">
                <Card className="h-100 text-center clickable-card">
                  <Card.Body>
                    <div className="mb-3 text-success">
                      <FaUsers size={40} />
                    </div>
                    <Card.Title>Mentor Yönetimi</Card.Title>
                    <Card.Text>
                      Mentorları yönetin ve stajyerlere atayın
                    </Card.Text>
                    <Badge bg="secondary">
                      {stats?.activeMentors || 0} Aktif Mentor
                    </Badge>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            
            <Col md={4} lg={3} className="mb-3">
              <Link to="/employer/departments" className="text-decoration-none">
                <Card className="h-100 text-center clickable-card">
                  <Card.Body>
                    <div className="mb-3 text-info">
                      <FaBuilding size={40} />
                    </div>
                    <Card.Title>Departmanlar</Card.Title>
                    <Card.Text>
                      Departmanları yönetin ve düzenleyin
                    </Card.Text>
                    <Badge bg="secondary">
                      {stats?.departments || 0} Departman
                    </Badge>
                  </Card.Body>
                </Card>
              </Link>
            </Col>
            
            <Col md={4} lg={3} className="mb-3">
              <Link to="/employer/messages" className="text-decoration-none">
                <Card className="h-100 text-center clickable-card">
                  <Card.Body>
                    <div className="mb-3 text-warning">
                      <FaEnvelope size={40} />
                    </div>
                    <Card.Title>Mesajlar</Card.Title>
                    <Card.Text>
                      Öğrenciler ve koordinatörlerle iletişim kurun
                    </Card.Text>
                    {stats?.unreadMessages > 0 && (
                      <Badge bg="danger">
                        {stats.unreadMessages} Yeni Mesaj
                      </Badge>
                    )}
                  </Card.Body>
                </Card>
              </Link>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Ek Bilgiler */}
      <Row>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>
                <FaClock className="me-2 text-warning" />
                Son İşlemler
              </Card.Title>
              <Alert variant="info">
                Son işlemler özelliği yakında eklenecek.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title>
                <FaChartBar className="me-2 text-primary" />
                İstatistikler
              </Card.Title>
              <Alert variant="info">
                Detaylı istatistikler yakında eklenecek.
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EmployerDashboard;