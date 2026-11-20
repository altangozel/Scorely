import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserGraduate, FaChartBar, FaList, FaStar } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CoordinatorDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [topCVs, setTopCVs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // İstatistikleri getir
        const statsResponse = await api.get('/coordinator/statistics');
        setStats(statsResponse.data);
        
        // En iyi CV'leri getir
        const topCVsResponse = await api.get('/coordinator/top-cvs', { params: { limit: 5 } });
        setTopCVs(topCVsResponse.data.cvs || []);
      } catch (err) {
        console.error('Dashboard veri yükleme hatası:', err);
        setError('Veriler yüklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Skor renk sınıfını belirle
  const getScoreColorClass = (score) => {
    if (score >= 90) return 'bg-success text-white';
    if (score >= 75) return 'bg-info text-white';
    if (score >= 60) return 'bg-primary text-white';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger text-white';
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Veriler yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Koordinatör Paneli</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Özet Kartları */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="mb-3 text-center h-100">
            <Card.Body>
              <div className="display-4 text-primary mb-2">
                {stats?.total_cvs || 0}
              </div>
              <Card.Title>Toplam CV</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-3 text-center h-100">
            <Card.Body>
              <div className="display-4 text-info mb-2">
                {stats?.average_scores?.total ? Math.round(stats.average_scores.total) : 0}
              </div>
              <Card.Title>Ortalama Skor</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-3 text-center h-100">
            <Card.Body>
              <div className="display-4 text-success mb-2">
                {stats?.excellent_cvs || 0}
              </div>
              <Card.Title>Mükemmel CV'ler</Card.Title>
              <small className="text-muted">(90+ puan)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="mb-3 text-center h-100">
            <Card.Body>
              <div className="display-4 text-warning mb-2">
                {stats?.needs_improvement_cvs || 0}
              </div>
              <Card.Title>İyileştirilecek CV'ler</Card.Title>
              <small className="text-muted">(40 altı puan)</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Hızlı Erişim Butonları */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <Card.Title>Hızlı Erişim</Card.Title>
              <div className="d-flex flex-wrap gap-2 mt-3">
                <Link to="/coordinator/cvs">
                  <Button variant="primary">
                    <FaList className="me-2" /> Tüm CV'leri Görüntüle
                  </Button>
                </Link>
                <Link to="/coordinator/statistics">
                  <Button variant="info">
                    <FaChartBar className="me-2" /> Detaylı İstatistikler
                  </Button>
                </Link>
                <Link to="/coordinator/students">
                  <Button variant="success">
                    <FaUserGraduate className="me-2" /> Öğrenci Yönetimi
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* En İyi CV'ler */}
      <Row className="mb-4">
        <Col md={12}>
          <Card>
            <Card.Body>
              <Card.Title>
                <FaStar className="me-2 text-warning" /> 
                En Yüksek Skorlu CV'ler
              </Card.Title>
              
              {topCVs.length === 0 ? (
                <Alert variant="info" className="mt-3">
                  Henüz değerlendirilmiş CV bulunmuyor.
                </Alert>
              ) : (
                <div className="table-responsive mt-3">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Öğrenci</th>
                        <th>Toplam Skor</th>
                        <th>Beceri</th>
                        <th>Deneyim</th>
                        <th>Eğitim</th>
                        <th>Dil</th>
                        <th>Öne Çıkan Beceriler</th>
                        <th>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topCVs.map(cv => (
                        <tr key={cv.id}>
                          <td>{cv.user.name}</td>
                          <td>
                            <span className={`badge ${getScoreColorClass(cv.total_score)}`}>
                              {cv.total_score}
                            </span>
                          </td>
                          <td>{cv.skill_score}</td>
                          <td>{cv.experience_score}</td>
                          <td>{cv.education_score}</td>
                          <td>{cv.language_score}</td>
                          <td>
                            {(cv.skills || []).map((skill, index) => (
                              <span key={index} className="badge bg-secondary me-1">
                                {skill}
                              </span>
                            ))}
                            {(!cv.skills || cv.skills.length === 0) && (
                              <span className="text-muted">Beceri bulunamadı</span>
                            )}
                          </td>
                          <td>
                            <a 
                              href={`/coordinator/cv/${cv.id}`} 
                              className="btn btn-sm btn-outline-primary me-1"
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              İncele
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="text-end mt-3">
                <Link to="/coordinator/cvs">
                  <Button variant="outline-primary">
                    Tüm CV'leri Görüntüle
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CoordinatorDashboard;