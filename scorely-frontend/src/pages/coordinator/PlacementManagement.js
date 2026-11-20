// src/pages/coordinator/PlacementManagement.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaCalculator, FaToggleOn, FaToggleOff, FaEdit, FaCheckCircle, FaTimesCircle, FaBuilding } from 'react-icons/fa';
import { placementService, programCodeService, userService } from '../../services/api';

const PlacementManagement = () => {
  const [programCodes, setProgramCodes] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [calculating, setCalculating] = useState(false);
  const [calculationSuccess, setCalculationSuccess] = useState('');
  const [calculationError, setCalculationError] = useState('');
  
  const [showGPAModal, setShowGPAModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newGPA, setNewGPA] = useState('');
  const [updatingGPA, setUpdatingGPA] = useState(false);
  const [gpaError, setGpaError] = useState('');
  
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [visibilityError, setVisibilityError] = useState('');
  const [visibilitySuccess, setVisibilitySuccess] = useState('');

  // Program kodlarını yükle
  const loadProgramCodes = async () => {
    try {
      const response = await programCodeService.getAllProgramCodes();
      const activeCodes = (response.data.program_codes || []).filter(p => p.is_active);
      setProgramCodes(activeCodes);
      
      // Eğer aktif program varsa ilkini seç
      if (activeCodes.length > 0 && !selectedProgram) {
        setSelectedProgram(activeCodes[0].code);
      }
    } catch (err) {
      console.error('Program kodları yükleme hatası:', err);
      setError('Program kodları yüklenirken bir hata oluştu.');
    }
  };

  // Yerleştirmeleri yükle
  const loadPlacements = async () => {
    if (!selectedProgram) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await placementService.getPlacementsForCoordinator({ program_code: selectedProgram });
      setApplications(response.data.applications || []);
      setCompanies(response.data.companies || []);
      
      // Sonuçların görünürlüğünü kontrol et
      const anyVisible = response.data.applications?.some(app => 
        app.InternshipPlacements?.some(p => p.is_visible_to_student)
      );
      setResultsVisible(anyVisible);
    } catch (err) {
      console.error('Yerleştirme yükleme hatası:', err);
      setError('Yerleştirmeler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    loadProgramCodes();
  }, []);

  // Program değiştiğinde yerleştirmeleri yükle
  useEffect(() => {
    if (selectedProgram) {
      loadPlacements();
    }
  }, [selectedProgram]);

  // Yerleştirme hesaplama
  const handleCalculatePlacements = async () => {
    if (!selectedProgram) return;
    
    if (!window.confirm('Yerleştirmeleri hesaplamak istediğinizden emin misiniz? Mevcut yerleştirmeler güncellenecektir.')) {
      return;
    }
    
    setCalculating(true);
    setCalculationError('');
    setCalculationSuccess('');
    
    try {
      await placementService.calculatePlacements({ program_code: selectedProgram });
      setCalculationSuccess('Yerleştirmeler başarıyla hesaplandı. Şimdi şirket onayları için sonuçları görünür yapabilirsiniz.');
      
      // Yerleştirmeleri yeniden yükle
      await loadPlacements();
    } catch (err) {
      console.error('Yerleştirme hesaplama hatası:', err);
      setCalculationError('Yerleştirmeler hesaplanırken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setCalculating(false);
    }
  };

  // GPA güncelleme modalını aç
  const openGPAModal = (student) => {
    setSelectedStudent(student);
    setNewGPA(student.gpa || '');
    setGpaError('');
    setShowGPAModal(true);
  };

  // GPA güncelleme
  const handleUpdateGPA = async () => {
    if (!selectedStudent) return;
    
    if (newGPA === '' || isNaN(newGPA) || parseFloat(newGPA) < 0 || parseFloat(newGPA) > 4.0) {
      setGpaError('Lütfen 0-4.0 arasında geçerli bir GPA giriniz.');
      return;
    }
    
    setUpdatingGPA(true);
    setGpaError('');
    
    try {
      await userService.updateStudentGPA(selectedStudent.id, { gpa: parseFloat(newGPA) });
      
      // Öğrenci GPA'sını güncelle
      setApplications(prev => 
        prev.map(app => {
          if (app.User.id === selectedStudent.id) {
            return {
              ...app,
              User: {
                ...app.User,
                gpa: parseFloat(newGPA)
              }
            };
          }
          return app;
        })
      );
      
      // Modalı kapat
      setShowGPAModal(false);
    } catch (err) {
      console.error('GPA güncelleme hatası:', err);
      setGpaError('GPA güncellenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingGPA(false);
    }
  };

  // Yerleştirme sonuçlarının görünürlüğünü değiştir
  const toggleResultsVisibility = async () => {
    if (!selectedProgram) return;
    
    setTogglingVisibility(true);
    setVisibilityError('');
    setVisibilitySuccess('');
    
    try {
      await placementService.toggleVisibility({ 
        program_code: selectedProgram, 
        is_visible: !resultsVisible 
      });
      
      setVisibilitySuccess(`Yerleştirme sonuçları ${!resultsVisible ? 'görünür' : 'gizli'} yapıldı.`);
      setResultsVisible(!resultsVisible);
      
      // Modalı kapat
      setTimeout(() => {
        setShowResultsModal(false);
        setVisibilitySuccess('');
      }, 2000);
    } catch (err) {
      console.error('Görünürlük değiştirme hatası:', err);
      setVisibilityError('Görünürlük değiştirilirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setTogglingVisibility(false);
    }
  };

  // Yerleştirme durumunu Türkçe'ye çevir
  const getPlacementStatusText = (status) => {
    const statusMap = {
      'placed': 'Yerleştirildi',
      'placed_alternative': 'Alternatif Yerleştirme',
      'not_placed': 'Yerleştirilmedi'
    };
    
    return statusMap[status] || status;
  };

  // Yerleştirme durumuna göre badge rengi
  const getStatusBadgeClass = (status) => {
    const badgeMap = {
      'placed': 'success',
      'placed_alternative': 'warning',
      'not_placed': 'secondary'
    };
    
    return badgeMap[status] || 'secondary';
  };

  // Şirket onay durumunu Türkçe'ye çevir
  const getApprovalStatusText = (status) => {
    const statusMap = {
      'pending': 'Beklemede',
      'approved': 'Onaylandı',
      'rejected': 'Reddedildi'
    };
    
    return statusMap[status] || 'Beklemede';
  };

  // Şirket onay durumuna göre badge rengi
  const getApprovalBadgeClass = (status) => {
    const badgeMap = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    };
    
    return badgeMap[status] || 'secondary';
  };

  // Şirkete yerleşen öğrencileri göster
  const getStudentsForCompany = (companyId, status) => {
    return applications
      .filter(app => app.InternshipPlacements?.some(p => 
        p.company_id === companyId && p.placement_status === status
      ))
      .map(app => {
        const placement = app.InternshipPlacements.find(p => 
          p.company_id === companyId && p.placement_status === status
        );
        return {
          id: app.User.id,
          name: `${app.User.first_name} ${app.User.last_name}`,
          gpa: app.User.gpa || 0,
          cv_score: app.CV?.total_score || 0,
          company_approval_status: placement?.company_approval_status || null
        };
      })
      .sort((a, b) => b.gpa - a.gpa);
  };

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Staj Yerleştirme Yönetimi</span>
            <div>
              <Button 
                variant="light" 
                size="sm"
                className="me-2"
                onClick={() => setShowResultsModal(true)}
                disabled={!selectedProgram || applications.length === 0}
              >
                {resultsVisible ? (
                  <><FaToggleOff className="me-1" /> Sonuçları Gizle</>
                ) : (
                  <><FaToggleOn className="me-1" /> Sonuçları Göster</>
                )}
              </Button>
              <Button 
                variant="success" 
                size="sm"
                onClick={handleCalculatePlacements}
                disabled={!selectedProgram || calculating || companies.length === 0 || applications.length === 0}
              >
                {calculating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-1"
                    />
                    Hesaplanıyor...
                  </>
                ) : (
                  <><FaCalculator className="me-1" /> Yerleştirmeleri Hesapla</>
                )}
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Program</Form.Label>
                <Form.Select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value)}
                  disabled={programCodes.length === 0}
                >
                  {programCodes.length === 0 ? (
                    <option>Aktif program bulunamadı</option>
                  ) : (
                    <>
                      <option value="">Seçiniz...</option>
                      {programCodes.map(program => (
                        <option key={program.id} value={program.code}>
                          {program.name} ({program.code})
                        </option>
                      ))}
                    </>
                  )}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          {calculationSuccess && <Alert variant="success">{calculationSuccess}</Alert>}
          {calculationError && <Alert variant="danger">{calculationError}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          
          {!selectedProgram && (
            <Alert variant="info">
              Lütfen yerleştirmeleri görüntülemek için bir program seçin.
            </Alert>
          )}
          
          {selectedProgram && loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Yerleştirmeler yükleniyor...</p>
            </div>
          )}
          
          {selectedProgram && !loading && applications.length === 0 && (
            <Alert variant="info">
              Bu program için onaylanmış başvuru bulunamadı.
            </Alert>
          )}
          
          {selectedProgram && !loading && companies.length === 0 && (
            <Alert variant="warning">
              Bu program için şirket eklenmemiş. Önce "Staj Şirketleri Yönetimi" sayfasından şirket ekleyin.
            </Alert>
          )}
          
          {selectedProgram && !loading && applications.length > 0 && companies.length > 0 && (
            <>
              {/* Öğrenci Listesi */}
              <h5 className="mb-3">Öğrenci Listesi</h5>
              <div className="table-responsive mb-5">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Öğrenci</th>
                      <th>GPA</th>
                      <th>CV Puanı</th>
                      <th>Tercihler</th>
                      <th>Yerleştirme</th>
                      <th>Şirket Onayı</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => {
                      const placement = app.InternshipPlacements?.find(p => 
                        p.placement_status === 'placed' || p.placement_status === 'placed_alternative'
                      );
                      
                      return (
                        <tr key={app.id}>
                          <td>{app.User.first_name} {app.User.last_name}</td>
                          <td>
                            {app.User.gpa ? app.User.gpa.toFixed(2) : '-'}
                          </td>
                          <td>{app.CV?.total_score || 0}</td>
                          <td>
                            {app.InternshipPlacements && app.InternshipPlacements.length > 0 ? (
                              <ul className="m-0 ps-3">
                                {app.InternshipPlacements
                                  .filter(p => p.preference_order !== 999)
                                  .sort((a, b) => a.preference_order - b.preference_order)
                                  .map(placement => (
                                    <li key={placement.id}>
                                      {placement.InternshipCompany?.name || `Şirket #${placement.company_id}`}
                                    </li>
                                  ))
                                }
                              </ul>
                            ) : (
                              <span className="text-muted">Tercih yapılmamış</span>
                            )}
                          </td>
                          <td>
                            {placement ? (
                              <Badge bg={getStatusBadgeClass(placement.placement_status)}>
                                {placement.InternshipCompany?.name}
                              </Badge>
                            ) : (
                              <Badge bg="secondary">Yerleştirilmedi</Badge>
                            )}
                          </td>
                          <td>
                            {placement && placement.company_approval_status ? (
                              <Badge bg={getApprovalBadgeClass(placement.company_approval_status)}>
                                {getApprovalStatusText(placement.company_approval_status)}
                              </Badge>
                            ) : placement ? (
                              <Badge bg="warning">Beklemede</Badge>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => openGPAModal(app.User)}
                            >
                              <FaEdit /> GPA Düzenle
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              
              {/* Şirket Yerleştirmeleri */}
              <h5 className="mb-3">Şirket Yerleştirmeleri</h5>
              <Row>
                {companies.map(company => {
                  const placedStudents = getStudentsForCompany(company.id, 'placed');
                  const alternativeStudents = getStudentsForCompany(company.id, 'placed_alternative');
                  
                  return (
                    <Col md={6} lg={4} key={company.id} className="mb-4">
                      <Card>
                        <Card.Header className="bg-light">
                          <strong>{company.name}</strong>
                          <Badge bg="primary" className="ms-2">
                            Kontenjan: {company.available_positions}
                          </Badge>
                        </Card.Header>
                        <Card.Body>
                          <h6>Yerleştirilen Öğrenciler</h6>
                          {placedStudents.length > 0 ? (
                            <ul className="mb-3">
                              {placedStudents.map(student => (
                                <li key={student.id}>
                                  {student.name} (GPA: {student.gpa.toFixed(2)})
                                  {student.company_approval_status && (
                                    <Badge 
                                      bg={getApprovalBadgeClass(student.company_approval_status)} 
                                      className="ms-2"
                                      size="sm"
                                    >
                                      {getApprovalStatusText(student.company_approval_status)}
                                    </Badge>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-muted">Yerleştirilen öğrenci yok</p>
                          )}
                          
                          {alternativeStudents.length > 0 && (
                            <>
                              <h6>Alternatif Yerleştirme</h6>
                              <ul>
                                {alternativeStudents.map(student => (
                                  <li key={student.id}>
                                    {student.name} (GPA: {student.gpa.toFixed(2)})
                                    {student.company_approval_status && (
                                      <Badge 
                                        bg={getApprovalBadgeClass(student.company_approval_status)} 
                                        className="ms-2"
                                        size="sm"
                                      >
                                        {getApprovalStatusText(student.company_approval_status)}
                                      </Badge>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </Card.Body>
      </Card>

      {/* GPA Düzenleme Modalı */}
      <Modal show={showGPAModal} onHide={() => setShowGPAModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>GPA Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {gpaError && <Alert variant="danger">{gpaError}</Alert>}
          
          {selectedStudent && (
            <>
              <p><strong>Öğrenci:</strong> {selectedStudent.first_name} {selectedStudent.last_name}</p>
              <Form.Group className="mb-3">
                <Form.Label>GPA (0-4.0)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  max="4.0"
                  step="0.01"
                  value={newGPA}
                  onChange={(e) => setNewGPA(e.target.value)}
                />
                <Form.Text className="text-muted">
                  GPA değeri 0 ile 4.0 arasında olmalıdır.
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowGPAModal(false)}>
            İptal
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateGPA}
            disabled={updatingGPA}
          >
            {updatingGPA ? (
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
              'Güncelle'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sonuç Görünürlüğü Modalı */}
      <Modal show={showResultsModal} onHide={() => setShowResultsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yerleştirme Sonuçları</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {visibilityError && <Alert variant="danger">{visibilityError}</Alert>}
          {visibilitySuccess && <Alert variant="success">{visibilitySuccess}</Alert>}
          
          <p>
            Şu anda yerleştirme sonuçları öğrencilere <strong>{resultsVisible ? 'görünür' : 'gizli'}</strong> durumda.
          </p>
          {!visibilitySuccess && (
            <p>
              Sonuçları {resultsVisible ? 'gizlemek' : 'göstermek'} istediğinizden emin misiniz?
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!visibilitySuccess && (
            <>
              <Button variant="secondary" onClick={() => setShowResultsModal(false)}>
                İptal
              </Button>
              <Button 
                variant={resultsVisible ? 'warning' : 'success'}
                onClick={toggleResultsVisibility}
                disabled={togglingVisibility}
              >
                {togglingVisibility ? (
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
                ) : resultsVisible ? (
                  <><FaToggleOff className="me-1" /> Sonuçları Gizle</>
                ) : (
                  <><FaToggleOn className="me-1" /> Sonuçları Göster</>
                )}
              </Button>
            </>
          )}
          {visibilitySuccess && (
            <Button variant="secondary" onClick={() => setShowResultsModal(false)}>
              Kapat
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PlacementManagement;