import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const NotFound = () => {
  return (
    <Container className="py-5 text-center">
      <Row className="justify-content-center">
        <Col md={8}>
          <h1 className="display-1 fw-bold">404</h1>
          <h2 className="mb-4">Sayfa Bulunamadı</h2>
          <p className="lead mb-5">
            Aradığınız sayfa bulunamadı veya taşınmış olabilir.
          </p>
          <Link to="/">
            <Button variant="primary" size="lg">
              <FaHome className="me-2" />
              Ana Sayfaya Dön
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default NotFound;