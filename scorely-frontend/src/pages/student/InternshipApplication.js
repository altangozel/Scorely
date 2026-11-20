// src/pages/student/InternshipApplication.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap';
import { FaCheck, FaTimes, FaUpload, FaFileAlt, FaTrash, FaUndo } from 'react-icons/fa';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InternshipApplication = () => {
  const { currentUser } = useAuth();
  const [cvs, setCvs] = useState([]);
  const [loadingCVs, setLoadingCVs] = useState(true);
  const [programCode, setProgramCode] = useState('');
  const [selectedCV, setSelectedCV] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [programInfo, setProgramInfo] = useState(null);
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  
  // Başvuru geri çekme modalı için state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawApplication, setWithdrawApplication] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // Kullanıcının CV'lerini getir
  const loadUserCVs = async () => {
    setLoadingCVs(true);
    
    try {
      const response = await api.get('/cv/my-cv');
      if (response.data.cv) {
        setCvs([response.data.cv]);
      } else {
        setCvs([]);
      }
    } catch (err) {
      console.error('CV yükleme hatası:', err);
      // 404 hatasını yoksay (sadece CV yok anlamına gelir)
      if (err.response?.status !== 404) {
        alert('CV\'ler yüklenirken bir hata oluştu.');
      }
      setCvs([]);
    } finally {
      setLoadingCVs(false);
    }
  };

  // Kullanıcının başvurularını getir
  const loadApplications = async () => {
    setLoadingApplications(true);
    
    try {
      const response = await api.get('/internships/my-applications');
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error('Başvuru yükleme hatası:', err);
      // Sessizce hata yönet
    } finally {
      setLoadingApplications(false);
    }
  };

  // İlk yüklemede CV'leri ve başvuruları getir
  useEffect(() => {
    loadUserCVs();
    loadApplications();
    
    // Eğer kullanıcının approved_program_code'u varsa, otomatik doldur
    if (currentUser?.approved_program_code) {
      setProgramCode(currentUser.approved_program_code);
      // Otomatik doğrulama yap
      validateProgramCode(currentUser.approved_program_code);
    }
  }, [currentUser]);

  // Program kodunu doğrula
  const validateProgramCode = async (code = programCode) => {
    if (!code) {
      setCodeError('Program kodu giriniz.');
      return;
    }
    
    setValidatingCode(true);
    setCodeError('');
    setCodeValidated(false);
    setProgramInfo(null);
    
    try {
      const response = await api.post('/program-codes/validate', { code });
      
      if (response.data.valid) {
        setCodeValidated(true);
        setProgramInfo(response.data.program);
      } else {
        setCodeError(response.data.message || 'Geçersiz program kodu.');
      }
    } catch (err) {
      console.error('Kod doğrulama hatası:', err);
      setCodeError(err.response?.data?.message || 'Program kodu doğrulanırken bir hata oluştu.');
    } finally {
      setValidatingCode(false);
    }
  };

  // Başvuru gönder
  const submitApplication = async (e) => {
    e.preventDefault();
    
    if (!programCode || !selectedCV) {
      setSubmitError('Lütfen program kodu ve CV seçin.');
      return;
    }
    
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    
    try {
      const response = await api.post('/internships/apply', {
        program_code: programCode,
        cv_id: selectedCV
      });
      
      setSubmitSuccess('Staj başvurunuz başarıyla alındı!');
      
      // Başvuru listesini güncelle
      loadApplications();
      
      // Formu temizle
      setProgramCode('');
      setSelectedCV('');
      setCodeValidated(false);
      setProgramInfo(null);
    } catch (err) {
      console.error('Başvuru hatası:', err);
      setSubmitError(err.response?.data?.message || 'Başvuru gönderilirken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Başvuru geri çekme modalını aç
  const openWithdrawModal = (application) => {
    setWithdrawApplication(application);
    setWithdrawError('');
    setWithdrawSuccess('');
    setShowWithdrawModal(true);
  };
  
  // Başvuruyu geri çek
  const handleWithdrawApplication = async () => {
    if (!withdrawApplication) return;
    
    setWithdrawing(true);
    setWithdrawError('');
    
    try {
      await api.delete(`/internships/applications/${withdrawApplication.id}/withdraw`);
      
      setWithdrawSuccess('Başvuru başarıyla geri çekildi.');
      
      // Başvuru listesini güncelle
      setTimeout(() => {
        loadApplications();
        setShowWithdrawModal(false);
      }, 1500);
    } catch (err) {
      console.error('Başvuru geri çekme hatası:', err);
      setWithdrawError(err.response?.data?.message || 'Başvuru geri çekilirken bir hata oluştu.');
    } finally {
      setWithdrawing(false);
    }
  };

  // Başvuru durumunu Türkçe'ye çevir
  const getStatusText = (application) => {
    if (application.overall_status_text) {
      return application.overall_status_text;
    }
    
    const statusMap = {
      'coordinator_pending': 'Koordinatör Onayı Bekliyor',
      'coordinator_rejected': 'Koordinatör Tarafından Reddedildi',
      'company_pending': 'Şirket Onayı Bekliyor',
      'company_rejected': 'Şirket Tarafından Reddedildi',
      'fully_approved': 'Staj Onaylandı'
    };
    
    return statusMap[application.overall_status] || 'Beklemede';
  };

  // Başvuru durumuna göre badge rengi
  const getStatusBadgeClass = (application) => {
    const badgeMap = {
      'coordinator_pending': 'warning',
      'coordinator_rejected': 'danger',
      'company_pending': 'info',
      'company_rejected': 'secondary',
      'fully_approved': 'success'
    };
    
    return badgeMap[application.overall_status] || 'secondary';
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Staj Başvurusu</h2>
      
      <Row>
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header as="h5">Yeni Staj Başvurusu</Card.Header>
            <Card.Body>
              {submitSuccess && (
                <Alert variant="success" dismissible onClose={() => setSubmitSuccess('')}>
                  {submitSuccess}
                </Alert>
              )}
              
              {submitError && (
                <Alert variant="danger" dismissible onClose={() => setSubmitError('')}>
                  {submitError}
                </Alert>
              )}
              
              {currentUser?.approved_program_code && (
                <Alert variant="info">
                  <strong>Bilgi:</strong> Daha önce onaylanmış program kodunuz otomatik olarak yüklendi.
                </Alert>
              )}
              
              {loadingCVs ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">CV'leriniz yükleniyor...</p>
                </div>
              ) : cvs.length === 0 ? (
                <Alert variant="warning">
                  Staj başvurusu yapmak için önce bir CV yüklemelisiniz.{' '}
                  <a href="/cv-management" className="alert-link">CV Yönetimi</a> sayfasına giderek CV yükleyebilirsiniz.
                </Alert>
              ) : (
                <Form onSubmit={submitApplication}>
                  <Form.Group className="mb-3">
                    <Form.Label>Program Kodu</Form.Label>
                    <div className="d-flex">
                      <Form.Control
                        type="text"
                        placeholder="Koordinatör tarafından verilen kodu girin"
                        value={programCode}
                        onChange={(e) => setProgramCode(e.target.value)}
                        disabled={codeValidated || validatingCode}
                        className="me-2"
                      />
                      <Button 
                        variant="outline-primary"
                        onClick={() => validateProgramCode()}
                        disabled={!programCode || validatingCode || codeValidated}
                      >
                        {validatingCode ? (
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                        ) : codeValidated ? (
                          <FaCheck />
                        ) : (
                          'Doğrula'
                        )}
                      </Button>
                      {codeValidated && (
                        <Button 
                          variant="outline-secondary"
                          className="ms-2"
                          onClick={() => {
                            setCodeValidated(false);
                            setProgramInfo(null);
                            setProgramCode('');
                          }}
                        >
                          <FaUndo />
                        </Button>
                      )}
                    </div>
                    {codeError && <div className="text-danger mt-1">{codeError}</div>}
                    {codeValidated && programInfo && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <div><strong>Program:</strong> {programInfo.name}</div>
                        {programInfo.description && <div><strong>Açıklama:</strong> {programInfo.description}</div>}
                        <div><strong>Koordinatör:</strong> {programInfo.coordinator}</div>
                      </div>
                    )}
                  </Form.Group>
                  
                  {codeValidated && (
                    <Form.Group className="mb-3">
                      <Form.Label>CV Seçin</Form.Label>
                      <Form.Select
                        value={selectedCV}
                        onChange={(e) => setSelectedCV(e.target.value)}
                        required
                      >
                        <option value="">CV seçin</option>
                        {cvs.map(cv => (
                          <option key={cv.id} value={cv.id}>
                            {cv.original_filename} (Skor: {cv.total_score || 0})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                  
                  <div className="d-flex justify-content-end mt-4">
                    <Button 
                      variant="secondary" 
                      className="me-2"
                      onClick={() => {
                        setProgramCode('');
                        setSelectedCV('');
                        setCodeValidated(false);
                        setProgramInfo(null);
                        setCodeError('');
                      }}
                      disabled={submitting}
                    >
                      Temizle
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit"
                      disabled={!codeValidated || !selectedCV || submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Başvuru Gönderiliyor...
                        </>
                      ) : (
                        <><FaUpload className="me-2" /> Başvuruyu Gönder</>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card>
            <Card.Header as="h5">Başvurularım</Card.Header>
            <Card.Body>
              {loadingApplications ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" size="sm" />
                  <p className="mt-2">Başvurularınız yükleniyor...</p>
                </div>
              ) : applications.length === 0 ? (
                <Alert variant="info">
                  Henüz staj başvurunuz bulunmuyor.
                </Alert>
              ) : (
                <div>
                  {applications.map(app => (
                    <div key={app.id} className="mb-3 p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6>{app.ProgramCode?.name || 'Program'}</h6>
                          <div className="text-muted small">
                            Başvuru Tarihi: {new Date(app.created_at).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                        <Badge bg={getStatusBadgeClass(app)}>
                          {getStatusText(app)}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <strong>CV:</strong> {app.CV?.original_filename}
                        <div className="text-muted small">
                          CV Puanı: {app.CV?.total_score || 0}/100
                        </div>
                      </div>
                      {app.coordinator_notes && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <strong>Koordinatör Notu:</strong>
                          <div>{app.coordinator_notes}</div>
                        </div>
                      )}
                      {app.company_notes && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <strong>Şirket Notu:</strong>
                          <div>{app.company_notes}</div>
                        </div>
                      )}
                      {app.coordinator_status === 'pending' && (
                        <div className="mt-2">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openWithdrawModal(app)}
                          >
                            <FaTrash className="me-1" /> Başvuruyu Geri Çek
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Başvuru Geri Çekme Modalı */}
      <Modal show={showWithdrawModal} onHide={() => setShowWithdrawModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Başvuruyu Geri Çek</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {withdrawError && <Alert variant="danger">{withdrawError}</Alert>}
          {withdrawSuccess && <Alert variant="success">{withdrawSuccess}</Alert>}
          
          {withdrawApplication && !withdrawSuccess && (
            <>
              <p>
                <strong>{withdrawApplication.ProgramCode?.name}</strong> programına yaptığınız başvuruyu 
                geri çekmek istediğinizden emin misiniz?
              </p>
              <Alert variant="warning">
                <strong>Dikkat:</strong> Bu işlem geri alınamaz. Başvurunuz tamamen silinecektir.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!withdrawSuccess && (
            <>
              <Button variant="secondary" onClick={() => setShowWithdrawModal(false)}>
                İptal
              </Button>
              <Button 
                variant="danger"
                onClick={handleWithdrawApplication}
                disabled={withdrawing}
              >
                {withdrawing ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Geri Çekiliyor...
                  </>
                ) : (
                  <>
                    <FaTrash className="me-1" /> Başvuruyu Geri Çek
                  </>
                )}
              </Button>
            </>
          )}
          {withdrawSuccess && (
            <Button variant="secondary" onClick={() => setShowWithdrawModal(false)}>
              Kapat
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InternshipApplication;