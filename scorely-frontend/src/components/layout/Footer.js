import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row>
          <Col md={4}>
            <h5>Scorely</h5>
            <p className="text-muted">
              AI destekli akıllı işe alım ve staj eşleştirme platformu
            </p>
          </Col>
          <Col md={4}>
            <h5>Hızlı Bağlantılar</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-light">Ana Sayfa</a></li>
              <li><a href="/about" className="text-light">Hakkımızda</a></li>
              <li><a href="/contact" className="text-light">İletişim</a></li>
              <li><a href="/privacy" className="text-light">Gizlilik Politikası</a></li>
            </ul>
          </Col>
          <Col md={4}>
            <h5>İletişim</h5>
            <address className="text-muted">
              <p>İstanbul, Türkiye</p>
              <p>Email: info@scorely.com</p>
              <p>Tel: +90 212 123 4567</p>
            </address>
          </Col>
        </Row>
        <hr className="bg-secondary" />
        <Row>
          <Col className="text-center">
            <p className="mb-0">© {new Date().getFullYear()} Scorely. Tüm hakları saklıdır.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;