// src/pages/coordinator/ApplicationList.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Alert, Spinner, Modal } from 'react-bootstrap';
import { FaDownload, FaCheck, FaTimes, FaEye, FaComment, FaSort, FaSortUp, FaSortDown, FaUndo } from 'react-icons/fa';
import api from '../../services/api';
import { coordinatorService } from '../../services/api';

const ApplicationList = () => {
  const [programCodes, setProgramCodes] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal durumları
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  
  // Onay geri alma modalı için state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeApplication, setRevokeApplication] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState('');
  const [revokeSuccess, setRevokeSuccess] = useState('');
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Program kodlarını yükle
  const loadProgramCodes = async () => {
    setLoadingPrograms(true);
    
    try {
      const response = await api.get('/program-codes');
      const activeCodes = (response.data.program_codes || []).filter(p => p.is_active);
      setProgramCodes(activeCodes);
      
      // Eğer aktif program varsa ilkini seç
      if (activeCodes.length > 0 && !selectedProgram) {
        setSelectedProgram(activeCodes[0].code);
      }
    } catch (err) {
      console.error('Program kodları yükleme hatası:', err);
      setError('Program kodları yüklenirken bir hata oluştu.');
    } finally {
      setLoadingPrograms(false);
    }
  };

  // Başvuruları yükle
  const loadApplications = async () => {
    if (!selectedProgram) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/internships/applications', {
        params: {
          program_code: selectedProgram,
          status: statusFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      });
      
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error('Başvuru yükleme hatası:', err);
      setError('Başvurular yüklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede program kodlarını getir
  useEffect(() => {
    loadProgramCodes();
  }, []);

  // Program veya durum filtresi değiştiğinde başvuruları getir
  useEffect(() => {
    if (selectedProgram) {
      loadApplications();
    }
  }, [selectedProgram, statusFilter, sortBy, sortOrder]);

  // Sıralama değişikliği işlemi
  const handleSortByChange = (field) => {
    if (sortBy === field) {
      // Alan aynıysa sıralama yönünü değiştir
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Alan değiştiyse, yeni alanı ayarla ve yönü desc (yeniden eskiye) olarak ayarla
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Başvuru durumunu Türkçe'ye çevir
  const getStatusText = (application) => {
    if (application.coordinator_status === 'pending') {
      return 'Onay Bekliyor';
    } else if (application.coordinator_status === 'rejected') {
      return 'Reddedildi';
    } else if (application.coordinator_status === 'approved') {
      return 'Onaylandı';
    }
    return 'Bilinmiyor';
  };

  // Başvuru durumuna göre badge rengi
  const getStatusBadgeClass = (application) => {
    if (application.coordinator_status === 'pending') {
      return 'warning';
    } else if (application.coordinator_status === 'rejected') {
      return 'danger';
    } else if (application.coordinator_status === 'approved') {
      return 'success';
    }
    return 'secondary';
  };

  // Eğitim seviyesini Türkçe'ye çevir
  const getEducationLevelText = (level) => {
    const levels = {
      'doctorate': 'Doktora',
      'masters': 'Yüksek Lisans',
      'bachelors': 'Lisans',
      'associate': 'Ön Lisans',
      'high_school': 'Lise',
      'unknown': 'Belirtilmemiş'
    };
    
    return levels[level] || 'Belirtilmemiş';
  };

  // Durum modalını aç
  const openStatusModal = (application, status) => {
    setSelectedApplication(application);
    setNewStatus(status);
    setNotes(application.coordinator_notes || '');
    setUpdateError('');
    setUpdateSuccess('');
    setShowStatusModal(true);
  };

  // Onay geri alma modalını aç
  const openRevokeModal = (application) => {
    setRevokeApplication(application);
    setRevokeError('');
    setRevokeSuccess('');
    setShowRevokeModal(true);
  };

  // Başvuru durumunu güncelle
  const updateApplicationStatus = async () => {
    if (!selectedApplication || !newStatus) return;
    
    setUpdating(true);
    setUpdateError('');
    setUpdateSuccess('');
    
    try {
      await api.put(`/internships/applications/${selectedApplication.id}/status`, {
        coordinator_status: newStatus,
        coordinator_notes: notes
      });
      
      setUpdateSuccess('Başvuru durumu güncellendi.');
      
      // Başvuru listesini güncelle
      setTimeout(() => {
        loadApplications();
        setShowStatusModal(false);
      }, 1500);
    } catch (err) {
      console.error('Durum güncelleme hatası:', err);
      setUpdateError('Durum güncellenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  // Onayı geri al
  const handleRevokeApproval = async () => {
    if (!revokeApplication) return;
    
    setRevoking(true);
    setRevokeError('');
    
    try {
      await api.post(`/internships/applications/${revokeApplication.id}/revoke`);
      
      setRevokeSuccess('Başvuru onayı başarıyla geri alındı.');
      
      // Listeyi güncelle
      setTimeout(() => {
        loadApplications();
        setShowRevokeModal(false);
      }, 1500);
    } catch (err) {
      console.error('Onay geri alma hatası:', err);
      setRevokeError('Onay geri alınırken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setRevoking(false);
    }
  };

  // CV indir
  const downloadCV = async (id) => {
    try {
      window.open(`${apiBaseUrl}/api/cv/download/${id}`, '_blank');
    } catch (err) {
      console.error('CV indirme hatası:', err);
      alert('CV indirilirken bir hata oluştu!');
    }
  };

  // Skor renk sınıfı 
  const getScoreColorClass = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'primary';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          <Row className="align-items-center">
            <Col>Staj Başvuruları</Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {/* Filtreler */}
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Program</Form.Label>
                <Form.Select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  disabled={loadingPrograms || programCodes.length === 0}
                >
                  {loadingPrograms ? (
                    <option>Programlar yükleniyor...</option>
                  ) : programCodes.length === 0 ? (
                    <option>Aktif program bulunamadı</option>
                  ) : (
                    programCodes.map(program => (
                      <option key={program.id} value={program.code}>
                        {program.name} ({program.code})
                      </option>
                    ))
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Başvuru Durumu</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Sıralama butonları */}
          <Row className="mb-3">
            <Col>
              <div className="d-flex justify-content-end">
                <Button 
                  variant={sortBy === 'created_at' ? 'primary' : 'outline-primary'} 
                  className="me-2"
                  onClick={() => handleSortByChange('created_at')}
                >
                  Başvuru Tarihi {' '}
                  {sortBy === 'created_at' && (
                    sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </Button>
                <Button 
                  variant={sortBy === 'cv_score' ? 'primary' : 'outline-primary'} 
                  onClick={() => handleSortByChange('cv_score')}
                >
                  CV Puanı {' '}
                  {sortBy === 'cv_score' && (
                    sortOrder === 'desc' ? <FaSortDown /> : <FaSortUp />
                  )}
                </Button>
              </div>
            </Col>
          </Row>

          {/* Hata Gösterimi */}
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}

          {/* Yükleniyor */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary">
                <span className="visually-hidden">Yükleniyor...</span>
              </Spinner>
              <p className="mt-2">Başvurular yükleniyor...</p>
            </div>
          )}

          {/* Başvuru Listesi */}
          {!loading && (!applications || applications.length === 0) && (
            <Alert variant="info">
              Seçilen kriterlere uygun başvuru bulunamadı.
            </Alert>
          )}

          {!loading && applications && applications.length > 0 && (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Öğrenci</th>
                    <th>Eğitim</th>
                    <th>Deneyim</th>
                    <th>CV Puanı</th>
                    <th>Başvuru Durumu</th>
                    <th>Şirket Tercihi</th>
                    <th>Başvuru Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div>{app.User.first_name} {app.User.last_name}</div>
                        <div className="text-muted small">{app.User.email}</div>
                        {app.User.phone_number && <div className="text-muted small">{app.User.phone_number}</div>}
                      </td>
                      <td>{getEducationLevelText(app.CV.education_level)}</td>
                      <td>{app.CV.estimated_experience_years || 0} yıl</td>
                      <td>
                        <Badge className={`bg-${getScoreColorClass(app.CV.total_score)}`}>
                          {app.CV.total_score || 0}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusBadgeClass(app)}>
                          {getStatusText(app)}
                        </Badge>
                      </td>
                      <td>
                        {app.coordinator_status === 'approved' ? (
                          app.company_status === 'approved' ? 
                            <Badge bg="success">Tercih Yaptı</Badge> : 
                            <Badge bg="secondary">Tercih Yapmadı</Badge>
                        ) : (
                          <Badge bg="secondary">-</Badge>
                        )}
                      </td>
                      <td>{new Date(app.created_at).toLocaleDateString('tr-TR')}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1 mb-1"
                          onClick={() => downloadCV(app.CV.id)}
                        >
                          <FaDownload /> CV
                        </Button>
                        
                        {app.coordinator_status === 'pending' && (
                          <>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-1 mb-1"
                              onClick={() => openStatusModal(app, 'approved')}
                            >
                              <FaCheck /> Onayla
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="me-1 mb-1"
                              onClick={() => openStatusModal(app, 'rejected')}
                            >
                              <FaTimes /> Reddet
                            </Button>
                          </>
                        )}
                        
                        {app.coordinator_status === 'approved' && (
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="me-1 mb-1"
                            onClick={() => openRevokeModal(app)}
                          >
                            <FaUndo /> Onayı Geri Al
                          </Button>
                        )}
                        
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="mb-1"
                          onClick={() => openStatusModal(app, app.coordinator_status)}
                        >
                          <FaComment /> Not
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Durum Güncelleme Modalı */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {newStatus === 'approved' ? 'Başvuruyu Onayla' : 
             newStatus === 'rejected' ? 'Başvuruyu Reddet' : 'Başvuru Notu'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {updateError && <Alert variant="danger">{updateError}</Alert>}
          {updateSuccess && <Alert variant="success">{updateSuccess}</Alert>}
          
          {selectedApplication && (
            <>
              <div className="mb-3">
                <h6>Öğrenci: {selectedApplication.User.first_name} {selectedApplication.User.last_name}</h6>
                <div className="text-muted">{selectedApplication.User.email}</div>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Koordinatör Notu</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Başvuruyla ilgili not ekleyin (öğrenciye gösterilecektir)"
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            İptal
          </Button>
          {!updateSuccess && (
            <Button 
              variant={newStatus === 'approved' ? 'success' : 
                      newStatus === 'rejected' ? 'danger' : 'primary'}
              onClick={updateApplicationStatus}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Güncelleniyor...
                </>
              ) : (
                <>
                  {newStatus === 'approved' ? <><FaCheck className="me-1" /> Onayla</> : 
                   newStatus === 'rejected' ? <><FaTimes className="me-1" /> Reddet</> : 
                   <><FaComment className="me-1" /> Notu Güncelle</>}
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Onay Geri Alma Modalı */}
      <Modal show={showRevokeModal} onHide={() => setShowRevokeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Onayı Geri Al</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {revokeError && <Alert variant="danger">{revokeError}</Alert>}
          {revokeSuccess && <Alert variant="success">{revokeSuccess}</Alert>}
          
          {revokeApplication && !revokeSuccess && (
            <>
              <p>
                <strong>{revokeApplication.User.first_name} {revokeApplication.User.last_name}</strong> 
                {' '}adlı öğrencinin başvuru onayını geri almak istediğinizden emin misiniz?
              </p>
              <Alert variant="warning">
                <strong>Dikkat:</strong> Bu işlem öğrencinin şirket tercihlerini de etkileyebilir.
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!revokeSuccess && (
            <>
              <Button variant="secondary" onClick={() => setShowRevokeModal(false)}>
                İptal
              </Button>
              <Button 
                variant="warning"
                onClick={handleRevokeApproval}
                disabled={revoking}
              >
                {revoking ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <FaUndo className="me-1" /> Onayı Geri Al
                  </>
                )}
              </Button>
            </>
          )}
          {revokeSuccess && (
            <Button variant="secondary" onClick={() => setShowRevokeModal(false)}>
              Kapat
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ApplicationList;