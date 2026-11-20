// src/pages/student/CompanyPreferences.js
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { FaBuilding, FaTrash, FaSave, FaCheck, FaArrowUp, FaArrowDown, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { companyService, placementService, programCodeService } from '../../services/api';
import GPAUpdate from '../../components/student/GPAUpdate';
import { useAuth } from '../../context/AuthContext';

const CompanyPreferences = () => {
  const { currentUser } = useAuth();
  const [programCode, setProgramCode] = useState('');
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validateError, setValidateError] = useState('');
  const [programInfo, setProgramInfo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [placementResults, setPlacementResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // Program kodu değiştiğinde şirketleri getir
  const handleProgramCodeChange = async () => {
    if (!programCode && !currentUser?.approved_program_code) {
      setValidateError('Lütfen program kodu giriniz veya önce staj başvurusunun onaylanması gerekiyor.');
      return;
    }
    
    const codeToUse = programCode || currentUser?.approved_program_code;
    
    setLoading(true);
    setError('');
    setValidateError('');
    setProgramInfo(null);
    setCompanies([]);
    setSelectedCompanies([]);
    setAvailableCompanies([]);
    
    try {
      // Önce program kodunu doğrula
      const validateResponse = await programCodeService.validateProgramCode(codeToUse);
      
      if (validateResponse.data.valid) {
        setProgramInfo(validateResponse.data.program);
        setProgramCode(codeToUse); // Kullanılan kodu set et
        
        // Sonra şirketleri getir
        const companiesResponse = await companyService.getAvailableForStudent({ program_code: codeToUse });
        
        setCompanies(companiesResponse.data.companies || []);
        setAvailableCompanies(companiesResponse.data.companies || []);
        
        // Mevcut tercihleri al
        if (companiesResponse.data.existingPreferences && companiesResponse.data.existingPreferences.length > 0) {
          // Mevcut tercihleri seçili listeye ekle
          const selected = companiesResponse.data.existingPreferences
            .map(pref => {
              const company = companiesResponse.data.companies.find(c => c.id === pref.company_id);
              if (company) {
                return {
                  ...company,
                  preference_order: pref.preference_order
                };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => a.preference_order - b.preference_order);
          
          setSelectedCompanies(selected);
          
          // Seçili şirketleri mevcut listeden çıkar
          const selectedIds = selected.map(company => company.id);
          setAvailableCompanies(
            companiesResponse.data.companies.filter(company => !selectedIds.includes(company.id))
          );
        }
        
        // Yerleştirme sonuçlarını getir
        await loadPlacementResults(codeToUse);
      } else {
        setValidateError(validateResponse.data.message || 'Geçersiz program kodu.');
      }
    } catch (err) {
      console.error('Program kodu doğrulama hatası:', err);
      if (err.response?.status === 403) {
        setError('Bu program için koordinatör tarafından onaylanmış başvurunuz bulunmuyor. Lütfen önce staj başvurusunda bulunun.');
      } else {
        setError('Program kodu doğrulanırken bir hata oluştu: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Yerleştirme sonuçlarını yükle
  const loadPlacementResults = async (code) => {
    if (!code) return;
    
    setResultsLoading(true);
    
    try {
      const response = await placementService.getResults({ program_code: code });
      setPlacementResults(response.data.placements);
    } catch (err) {
      console.error('Yerleştirme sonuçları hatası:', err);
      // 403 hatası normal (sonuçlar henüz açıklanmamış)
      if (err.response?.status !== 403) {
        setError('Yerleştirme sonuçları alınırken bir hata oluştu.');
      }
      setPlacementResults(null);
    } finally {
      setResultsLoading(false);
    }
  };

  // Component mount olduğunda otomatik yükle
  React.useEffect(() => {
    if (currentUser?.approved_program_code) {
      handleProgramCodeChange();
    }
  }, [currentUser]);

  // Şirket seç
  const addCompany = (company) => {
    // Zaten eklenmiş mi kontrol et
    if (selectedCompanies.some(c => c.id === company.id)) {
      return;
    }
    
    // Yeni sıra numarası
    const newOrder = selectedCompanies.length + 1;
    
    // Şirketi seçili listeye ekle
    setSelectedCompanies([
      ...selectedCompanies,
      { ...company, preference_order: newOrder }
    ]);
    
    // Şirketi mevcut listeden çıkar
    setAvailableCompanies(availableCompanies.filter(c => c.id !== company.id));
  };

  // Şirket sil
  const removeCompany = (companyId) => {
    // Çıkarılacak şirketi bul
    const companyToRemove = selectedCompanies.find(c => c.id === companyId);
    if (!companyToRemove) return;
    
    // Şirketi seçili listeden çıkar
    const updatedSelected = selectedCompanies.filter(c => c.id !== companyId);
    
    // Sıra numaralarını güncelle
    const reorderedSelected = updatedSelected.map((company, index) => ({
      ...company,
      preference_order: index + 1
    }));
    
    setSelectedCompanies(reorderedSelected);
    
    // Şirketi mevcut listeye ekle
    setAvailableCompanies([...availableCompanies, companyToRemove]);
  };

  // Tercih sırasını yukarı taşı
  const movePreferenceUp = (companyId) => {
    const index = selectedCompanies.findIndex(c => c.id === companyId);
    if (index <= 0) return;
    
    const newSelectedCompanies = [...selectedCompanies];
    // Elemanları yer değiştir
    [newSelectedCompanies[index-1], newSelectedCompanies[index]] = 
    [newSelectedCompanies[index], newSelectedCompanies[index-1]];
    
    // Tercih sırasını güncelle
    newSelectedCompanies[index-1].preference_order = index;
    newSelectedCompanies[index].preference_order = index + 1;
    
    setSelectedCompanies(newSelectedCompanies);
  };

  // Tercih sırasını aşağı taşı
  const movePreferenceDown = (companyId) => {
    const index = selectedCompanies.findIndex(c => c.id === companyId);
    if (index === -1 || index >= selectedCompanies.length - 1) return;
    
    const newSelectedCompanies = [...selectedCompanies];
    // Elemanları yer değiştir
    [newSelectedCompanies[index], newSelectedCompanies[index+1]] = 
    [newSelectedCompanies[index+1], newSelectedCompanies[index]];
    
    // Tercih sırasını güncelle
    newSelectedCompanies[index].preference_order = index + 1;
    newSelectedCompanies[index+1].preference_order = index + 2;
    
    setSelectedCompanies(newSelectedCompanies);
  };

  // Tercihleri kaydet
  const savePreferences = async () => {
    if (!programCode || selectedCompanies.length === 0) {
      setSaveError('Lütfen en az bir şirket seçiniz.');
      return;
    }
    
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      // Tercihleri formatlayıp kaydet
      const preferences = selectedCompanies.map(company => ({
        company_id: company.id,
        preference_order: company.preference_order
      }));
      
      await placementService.savePreferences({
        program_code: programCode,
        preferences
      });
      
      setSaveSuccess('Şirket tercihleriniz başarıyla kaydedildi. Staj yerleştirme sonuçları açıklandığında bu sayfadan görüntüleyebilirsiniz.');
    } catch (err) {
      console.error('Tercih kaydetme hatası:', err);
      setSaveError('Tercihler kaydedilirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
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
  const getCompanyApprovalText = (status) => {
    const statusMap = {
      'pending': 'Şirket Onayı Bekleniyor',
      'approved': 'Şirket Tarafından Onaylandı',
      'rejected': 'Şirket Tarafından Reddedildi'
    };
    
    return statusMap[status] || 'Şirket Onayı Bekleniyor';
  };

  // Şirket onay durumuna göre badge rengi
  const getCompanyApprovalBadgeClass = (status) => {
    const badgeMap = {
      'pending': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    };
    
    return badgeMap[status] || 'warning';
  };

  // Şirket onay durumuna göre ikon
  const getCompanyApprovalIcon = (status) => {
    const iconMap = {
      'pending': <FaClock className="me-2" />,
      'approved': <FaCheckCircle className="me-2" />,
      'rejected': <FaTimesCircle className="me-2" />
    };
    
    return iconMap[status] || <FaClock className="me-2" />;
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Staj Şirketi Tercihleri</h2>
      
      <Row>
        <Col lg={4}>
          <GPAUpdate />
          
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Program Kodu</h5>
            </Card.Header>
            <Card.Body>
              {validateError && <Alert variant="danger">{validateError}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              
              {currentUser?.approved_program_code ? (
                <Alert variant="info">
                  <strong>Onaylı Program:</strong> {currentUser.approved_program_code}
                  <div className="mt-2">
                    <Button 
                      variant="primary"
                      onClick={handleProgramCodeChange}
                      disabled={loading}
                    >
                      {loading ? (
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                      ) : (
                        'Şirketleri Görüntüle'
                      )}
                    </Button>
                  </div>
                </Alert>
              ) : (
                <Alert variant="warning">
                  Şirket tercihlerini görüntülemek için önce staj başvurunuzun koordinatör tarafından onaylanması gerekmektedir.
                </Alert>
              )}
              
              {programInfo && (
                <div className="mt-3">
                  <h6>Program Bilgileri</h6>
                  <p className="mb-1"><strong>Program:</strong> {programInfo.name}</p>
                  {programInfo.description && <p className="mb-1"><strong>Açıklama:</strong> {programInfo.description}</p>}
                  <p className="mb-0"><strong>Koordinatör:</strong> {programInfo.coordinator}</p>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* Yerleştirme Sonuçları */}
          {programInfo && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Yerleştirme Sonuçları</h5>
              </Card.Header>
              <Card.Body>
                {resultsLoading ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <p className="mt-2">Sonuçlar yükleniyor...</p>
                  </div>
                ) : placementResults && placementResults.length > 0 ? (
                  <div>
                    <ListGroup>
                      {placementResults.map((placement, index) => (
                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">{placement.company_name}</div>
                            <div className="small text-muted">
                              {placement.preference_order}. tercih
                            </div>
                          </div>
                          <div className="text-end">
                            <Badge bg={getStatusBadgeClass(placement.placement_status)}>
                              {getPlacementStatusText(placement.placement_status)}
                            </Badge>
                            {placement.placement_status === 'placed' || placement.placement_status === 'placed_alternative' ? (
                              <div className="mt-2">
                                <Badge bg={getCompanyApprovalBadgeClass(placement.company_approval_status)}>
                                  {getCompanyApprovalIcon(placement.company_approval_status)}
                                  {getCompanyApprovalText(placement.company_approval_status)}
                                </Badge>
                              </div>
                            ) : null}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                    
                    {placementResults.some(p => p.placement_status === 'placed' && p.company_approval_status === 'pending') && (
                      <Alert variant="info" className="mt-3">
                        <FaClock className="me-2" /> 
                        Tebrikler! Bir staj programına yerleştirildiniz. Şirket onayı bekleniyor.
                      </Alert>
                    )}
                    
                    {placementResults.some(p => p.placement_status === 'placed' && p.company_approval_status === 'approved') && (
                      <Alert variant="success" className="mt-3">
                        <FaCheckCircle className="me-2" /> 
                        Tebrikler! Staj yeriniz kesinleşti. Şirket tarafından onaylandınız.
                      </Alert>
                    )}
                    
                    {placementResults.some(p => p.placement_status === 'placed' && p.company_approval_status === 'rejected') && (
                      <Alert variant="danger" className="mt-3">
                        <FaTimesCircle className="me-2" /> 
                        Maalesef şirket tarafından reddedildiniz. Koordinatörünüz ile iletişime geçiniz.
                      </Alert>
                    )}
                    
                    {placementResults.find(p => p.company_approval_notes) && (
                      <Alert variant="info" className="mt-3">
                        <strong>Şirket Notu:</strong> {placementResults.find(p => p.company_approval_notes).company_approval_notes}
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert variant="info">
                    Yerleştirme sonuçları henüz açıklanmadı. Sonuçlar açıklandığında burada görüntülenecektir.
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
        
        <Col lg={8}>
          {programInfo && companies.length > 0 && (
            <>
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <FaBuilding className="me-2" />
                    Şirket Tercihleri
                  </h5>
                </Card.Header>
                <Card.Body>
                  {saveError && <Alert variant="danger">{saveError}</Alert>}
                  {saveSuccess && <Alert variant="success">{saveSuccess}</Alert>}
                  
                  <Row>
                    <Col md={6}>
                      <h6>Mevcut Şirketler</h6>
                      {availableCompanies.length === 0 ? (
                        <Alert variant="info">
                          Tüm şirketleri tercih listenize eklediniz.
                        </Alert>
                      ) : (
                        <ListGroup>
                          {availableCompanies.map(company => (
                            <ListGroup.Item 
                              key={company.id} 
                              action 
                              onClick={() => addCompany(company)}
                              className="d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <div className="fw-bold">{company.name}</div>
                                {company.location && (
                                  <div className="small text-muted">{company.location}</div>
                                )}
                              </div>
                              <Badge bg="primary">Kontenjan: {company.available_positions}</Badge>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </Col>
                    
                    <Col md={6}>
                      <h6>Tercih Listeniz</h6>
                      {selectedCompanies.length === 0 ? (
                        <Alert variant="warning">
                          Henüz bir şirket tercih etmediniz. Soldaki listeden şirket seçerek başlayın.
                        </Alert>
                      ) : (
                        <div>
                          {selectedCompanies.map((company, index) => (
                            <div 
                              key={company.id} 
                              className="mb-2 border rounded p-2 bg-light"
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center">
                                  <Badge bg="primary" className="me-2">
                                    {company.preference_order}
                                  </Badge>
                                  <div>
                                    <div className="fw-bold">{company.name}</div>
                                    {company.location && (
                                      <div className="small text-muted">{company.location}</div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  {index > 0 && (
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      className="me-1"
                                      onClick={() => movePreferenceUp(company.id)}
                                    >
                                      <FaArrowUp />
                                    </Button>
                                  )}
                                  {index < selectedCompanies.length - 1 && (
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      className="me-1"
                                      onClick={() => movePreferenceDown(company.id)}
                                    >
                                      <FaArrowDown />
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => removeCompany(company.id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {selectedCompanies.length > 0 && (
                        <div className="mt-3">
                          <Button
                            variant="success"
                            onClick={savePreferences}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  role="status"
                                  aria-hidden="true"
                                  className="me-2"
                                />
                                Kaydediliyor...
                              </>
                            ) : (
                              <><FaSave className="me-2" /> Tercihleri Kaydet</>
                            )}
                          </Button>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
              
              {/* Şirket Detayları */}
              <h5 className="mb-3">Şirket Detayları</h5>
              <Row>
                {companies.map(company => (
                  <Col md={6} key={company.id} className="mb-4">
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">{company.name}</h6>
                      </Card.Header>
                      <Card.Body>
                        {company.location && (
                          <p><strong>Lokasyon:</strong> {company.location}</p>
                        )}
                        <p><strong>Kontenjan:</strong> {company.available_positions}</p>
                        {company.description && (
                          <div className="mb-3">
                            <strong>Açıklama:</strong>
                            <p className="mt-1">{company.description}</p>
                          </div>
                        )}
                        {company.requirements && (
                          <div>
                            <strong>Gereksinimler:</strong>
                            <p className="mt-1">{company.requirements}</p>
                          </div>
                        )}
                        
                        {selectedCompanies.some(c => c.id === company.id) ? (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeCompany(company.id)}
                          >
                            Tercihlerden Çıkar
                          </Button>
                        ) : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => addCompany(company)}
                          >
                            Tercih Listene Ekle
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
          
          {programInfo && companies.length === 0 && (
            <Alert variant="warning">
              Bu program için henüz şirket eklenmemiş. Lütfen daha sonra tekrar kontrol edin.
            </Alert>
          )}
          
          {!programInfo && (
            <Alert variant="info">
              Şirket tercihlerini görüntülemek için önce staj başvurunuzun koordinatör tarafından onaylanması gerekmektedir.
            </Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default CompanyPreferences;