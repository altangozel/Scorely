import React from 'react';
import { Container, Row, Col, Card, Button, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaChartLine, FaUserTie, FaGraduationCap } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-3">AI Destekli Akıllı İşe Alım Platformu</h1>
              <p className="lead mb-4">
                Scorely, yapay zeka ile CV analizi yaparak doğru adayları ve iş fırsatlarını eşleştirir. Objektif değerlendirme, hızlı işe alım ve daha iyi kariyer kararları için Scorely'i kullanın.
              </p>
              {!isAuthenticated && (
                <div className="d-flex flex-wrap gap-2">
                  <Link to="/register">
                    <Button variant="light" size="lg">Hemen Kaydol</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline-light" size="lg">Giriş Yap</Button>
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <Link to="/dashboard">
                  <Button variant="light" size="lg">Dashboard'a Git</Button>
                </Link>
              )}
            </Col>
            <Col lg={6} className="text-center mt-4 mt-lg-0">
              <Image 
                src="/hero-image.png" 
                alt="Scorely AI Recruitment" 
                fluid 
                style={{ maxHeight: '400px' }}
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Scorely'in Özellikleri</h2>
        <Row>
          <Col md={3} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Body>
                <div className="text-primary mb-3">
                  <FaFileAlt size={48} />
                </div>
                <Card.Title>Akıllı CV Analizi</Card.Title>
                <Card.Text>
                  Yapay zeka destekli CV analizi ile becerileri, deneyimi ve eğitimi otomatik olarak tespit edin.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Body>
                <div className="text-primary mb-3">
                  <FaChartLine size={48} />
                </div>
                <Card.Title>Objektif Puanlama</Card.Title>
                <Card.Text>
                  Adayları objektif kriterlerle değerlendirin ve en uygun adayları hızlıca belirleyin.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Body>
                <div className="text-primary mb-3">
                  <FaUserTie size={48} />
                </div>
                <Card.Title>İşe Alım Otomasyonu</Card.Title>
                <Card.Text>
                  İşe alım süreçlerinizi otomatikleştirin, zamandan tasarruf edin ve en uygun adayları bulun.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Body>
                <div className="text-primary mb-3">
                  <FaGraduationCap size={48} />
                </div>
                <Card.Title>Staj Eşleştirme</Card.Title>
                <Card.Text>
                  Öğrenciler ve şirketler arasında en uygun staj eşleştirmelerini yapın.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* CTA Section */}
      <div className="bg-light py-5">
        <Container className="text-center">
          <h2 className="mb-4">Daha İyi İşe Alım Kararları İçin Scorely'i Deneyin</h2>
          <p className="lead mb-4">
            Ister işveren, ister iş arayan olun, Scorely ile işe alım süreçlerinizi iyileştirin.
          </p>
          {!isAuthenticated && (
            <Link to="/register">
              <Button variant="primary" size="lg">Hemen Başlayın</Button>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/dashboard">
              <Button variant="primary" size="lg">Dashboard'a Git</Button>
            </Link>
          )}
        </Container>
      </div>
    </>
  );
};

export default Home;