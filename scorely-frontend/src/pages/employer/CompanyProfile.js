import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaBuilding, FaSave, FaGlobe, FaPhone, FaMapMarkerAlt, FaUsers, FaIndustry } from 'react-icons/fa';
import { employerService } from '../../services/api';

const CompanyProfile = () => {
  const [profile, setProfile] = useState({
    company_name: '',
    tax_number: '',
    address: '',
    phone: '',
    website: '',
    sector: '',
    employee_count: '',
    description: '',
    logo_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await employerService.getCompanyProfile();
      if (response.data.profile) {
        setProfile({
          company_name: response.data.profile.company_name || '',
          tax_number: response.data.profile.tax_number || '',
          address: response.data.profile.address || '',
          phone: response.data.profile.phone || '',
          website: response.data.profile.website || '',
          sector: response.data.profile.sector || '',
          employee_count: response.data.profile.employee_count || '',
          description: response.data.profile.description || '',
          logo_url: response.data.profile.logo_url || ''
        });
      }
    } catch (err) {
      console.error('Profil yükleme hatası:', err);
      if (err.response?.status !== 404) {
        setError('Profil yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      await employerService.updateCompanyProfile(profile);
      setSuccess('Şirket profili başarıyla güncellendi.');
    } catch (err) {
      console.error('Profil güncelleme hatası:', err);
      setError('Profil güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Profil yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card>
        <Card.Header as="h5" className="bg-primary text-white">
          <FaBuilding className="me-2" />
          Şirket Profili
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaBuilding className="me-1" />
                    Şirket Adı*
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="company_name"
                    value={profile.company_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Vergi Numarası</Form.Label>
                  <Form.Control
                    type="text"
                    name="tax_number"
                    value={profile.tax_number}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaPhone className="me-1" />
                    Telefon
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaGlobe className="me-1" />
                    Web Sitesi
                  </Form.Label>
                  <Form.Control
                    type="url"
                    name="website"
                    value={profile.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaIndustry className="me-1" />
                    Sektör
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="sector"
                    value={profile.sector}
                    onChange={handleChange}
                    placeholder="Örn: Bilgi Teknolojileri"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <FaUsers className="me-1" />
                    Çalışan Sayısı
                  </Form.Label>
                  <Form.Select
                    name="employee_count"
                    value={profile.employee_count}
                    onChange={handleChange}
                  >
                    <option value="">Seçiniz...</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1000+">1000+</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>
                <FaMapMarkerAlt className="me-1" />
                Adres
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={profile.address}
                onChange={handleChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Şirket Hakkında</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={profile.description}
                onChange={handleChange}
                placeholder="Şirketiniz hakkında kısa bilgi..."
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Logo URL</Form.Label>
              <Form.Control
                type="url"
                name="logo_url"
                value={profile.logo_url}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
              />
            </Form.Group>
            
            <div className="text-end">
              <Button 
                variant="primary" 
                type="submit"
                disabled={saving}
                size="lg"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Profili Güncelle
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CompanyProfile;