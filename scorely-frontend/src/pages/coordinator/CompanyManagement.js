// src/pages/coordinator/CompanyManagement.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUserTie, FaInfoCircle } from 'react-icons/fa';
import { companyService, programCodeService } from '../../services/api';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [programCodes, setProgramCodes] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Şirket ekleme modalı için state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    location: '',
    available_positions: 1,
    description: '',
    requirements: '',
    program_code: '',
    application_deadline: ''
  });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  
  // Mentor bilgisi için yeni state
  const [mentorInfo, setMentorInfo] = useState(null);
  const [checkingMentorInfo, setCheckingMentorInfo] = useState(false);
  
  // Şirket düzenleme modalı için state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  
  // Şirket silme modalı için state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCompany, setDeleteCompany] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  // Şirketleri yükle
  const loadCompanies = async () => {
    if (!selectedProgram) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await companyService.getAll({ program_code: selectedProgram });
      setCompanies(response.data.companies || []);
    } catch (err) {
      console.error('Şirket yükleme hatası:', err);
      setError('Şirketler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    loadProgramCodes();
  }, []);

  // Program değiştiğinde şirketleri yükle
  useEffect(() => {
    if (selectedProgram) {
      loadCompanies();
      // Yeni şirket modalında da program kodunu güncelle
      setNewCompany(prev => ({ ...prev, program_code: selectedProgram }));
    }
  }, [selectedProgram]);

  // Şirket adı değiştiğinde mentor bilgilerini kontrol et
  const checkCompanyMentorInfo = async (companyName) => {
    if (!companyName || companyName.length < 3) {
      setMentorInfo(null);
      return;
    }
    
    setCheckingMentorInfo(true);
    
    try {
      const response = await companyService.getCompanyMentorInfo(companyName);
      if (response.data.hasMentors) {
        setMentorInfo(response.data);
      } else {
        setMentorInfo(null);
      }
    } catch (err) {
      // 404 hatasını sessizce yönet
      if (err.response?.status !== 404) {
        console.error('Mentor bilgisi kontrol hatası:', err);
      }
      setMentorInfo(null);
    } finally {
      setCheckingMentorInfo(false);
    }
  };

  // Şirket ekleme formu gönderimi
  const handleAddCompany = async (e) => {
    e.preventDefault();
    
    if (!newCompany.name || !newCompany.program_code) {
      setAddError('Şirket adı ve program kodu gereklidir.');
      return;
    }
    
    setAdding(true);
    setAddError('');
    
    try {
      const response = await companyService.add(newCompany);
      
      // Mentor bilgisi varsa bildirim göster
      if (response.data.mentorInfo) {
        alert(`Şirket başarıyla eklendi. Bu şirketin ${response.data.mentorInfo.mentors.length} mentor kaydı bulunmaktadır.`);
      }
      
      // Şirket listesini güncelle
      setCompanies(prev => [response.data.company, ...prev]);
      
      // Modalı kapat
      setShowAddModal(false);
      
      // Formu temizle
      setNewCompany({
        name: '',
        location: '',
        available_positions: 1,
        description: '',
        requirements: '',
        program_code: selectedProgram,
        application_deadline: ''
      });
      
      // Mentor bilgisini temizle
      setMentorInfo(null);
    } catch (err) {
      console.error('Şirket ekleme hatası:', err);
      setAddError('Şirket eklenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setAdding(false);
    }
  };

  // Şirket düzenleme modalını aç
  const openEditModal = (company) => {
    setEditCompany(company);
    setEditError('');
    setShowEditModal(true);
  };

  // Şirket düzenleme formu gönderimi
  const handleEditCompany = async (e) => {
    e.preventDefault();
    
    if (!editCompany || !editCompany.name) {
      setEditError('Şirket adı gereklidir.');
      return;
    }
    
    setEditing(true);
    setEditError('');
    
    try {
      const response = await companyService.update(editCompany.id, {
        name: editCompany.name,
        location: editCompany.location,
        available_positions: editCompany.available_positions,
        description: editCompany.description,
        requirements: editCompany.requirements,
        application_deadline: editCompany.application_deadline,
        is_active: editCompany.is_active
      });
      
      // Şirket listesini güncelle
      setCompanies(prev => 
        prev.map(company => 
          company.id === editCompany.id ? response.data.company : company
        )
      );
      
      // Modalı kapat
      setShowEditModal(false);
    } catch (err) {
      console.error('Şirket güncelleme hatası:', err);
      setEditError('Şirket güncellenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditing(false);
    }
  };

  // Şirket silme modalını aç
  const openDeleteModal = (company) => {
    setDeleteCompany(company);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  // Şirket silme
  const handleDeleteCompany = async () => {
    if (!deleteCompany) return;
    
    setDeleting(true);
    setDeleteError('');
    
    try {
      await companyService.delete(deleteCompany.id);
      
      // Şirket listesini güncelle
      setCompanies(prev => prev.filter(company => company.id !== deleteCompany.id));
      
      // Modalı kapat
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Şirket silme hatası:', err);
      setDeleteError('Şirket silinirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Staj Şirketleri Yönetimi</span>
            <Button 
              variant="light" 
              size="sm"
              onClick={() => setShowAddModal(true)}
              disabled={!selectedProgram}
            >
              <FaPlus className="me-1" /> Yeni Şirket Ekle
            </Button>
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
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          {!selectedProgram && (
            <Alert variant="info">
              Lütfen şirketleri görüntülemek için bir program seçin.
            </Alert>
          )}
          
          {selectedProgram && loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Şirketler yükleniyor...</p>
            </div>
          )}
          
          {selectedProgram && !loading && companies.length === 0 && (
            <Alert variant="info">
              Bu program için henüz şirket eklenmemiş. Yeni şirket eklemek için "Yeni Şirket Ekle" butonunu kullanın.
            </Alert>
          )}
          
          {selectedProgram && !loading && companies.length > 0 && (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Şirket Adı</th>
                    <th>Lokasyon</th>
                    <th>Kontenjan</th>
                    <th>Durum</th>
                    <th>Son Başvuru</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(company => (
                    <tr key={company.id}>
                      <td>{company.name}</td>
                      <td>{company.location || '-'}</td>
                      <td>{company.available_positions}</td>
                      <td>
                        <Badge bg={company.is_active ? 'success' : 'secondary'}>
                          {company.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td>
                        {company.application_deadline
                          ? new Date(company.application_deadline).toLocaleDateString('tr-TR')
                          : 'Belirtilmemiş'
                        }
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => openEditModal(company)}
                        >
                          <FaEdit /> Düzenle
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal(company)}
                        >
                          <FaTrash /> Sil
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

      {/* Şirket Ekleme Modalı */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Yeni Staj Şirketi Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addError && <Alert variant="danger">{addError}</Alert>}
          
          <Form onSubmit={handleAddCompany}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Şirket Adı*</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCompany.name}
                    onChange={(e) => {
                      setNewCompany({...newCompany, name: e.target.value});
                      // Şirket adı yazıldıkça mentor bilgilerini kontrol et
                      if (e.target.value.length >= 3) {
                        checkCompanyMentorInfo(e.target.value);
                      } else {
                        setMentorInfo(null);
                      }
                    }}
                    required
                  />
                  {checkingMentorInfo && (
                    <Form.Text className="text-muted">
                      <Spinner size="sm" animation="border" className="me-1" />
                      Mentor bilgileri kontrol ediliyor...
                    </Form.Text>
                  )}
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Kontenjan*</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={newCompany.available_positions}
                    onChange={(e) => setNewCompany({...newCompany, available_positions: parseInt(e.target.value)})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lokasyon</Form.Label>
                  <Form.Control
                    type="text"
                    value={newCompany.location}
                    onChange={(e) => setNewCompany({...newCompany, location: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Son Başvuru Tarihi</Form.Label>
                  <Form.Control
                    type="date"
                    value={newCompany.application_deadline}
                    onChange={(e) => setNewCompany({...newCompany, application_deadline: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newCompany.description}
                onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Gereksinimler</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newCompany.requirements}
                onChange={(e) => setNewCompany({...newCompany, requirements: e.target.value})}
                placeholder="Örn: Minimum GPA 3.0, Java bilgisi gerekli, vs."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Program Kodu*</Form.Label>
              <Form.Select
                value={newCompany.program_code}
                onChange={(e) => setNewCompany({...newCompany, program_code: e.target.value})}
                required
              >
                <option value="">Seçiniz...</option>
                {programCodes.map(program => (
                  <option key={program.id} value={program.code}>
                    {program.name} ({program.code})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            {/* Mentor Bilgisi Gösterimi */}
            {mentorInfo && mentorInfo.hasMentors && (
              <Alert variant="info">
                <h6><FaInfoCircle className="me-2" />Şirket Bilgileri Bulundu!</h6>
                <p className="mb-2">
                  <strong>{mentorInfo.company.name}</strong> şirketi sistemde kayıtlı.
                </p>
                <p className="mb-2">
                  <strong>Sektör:</strong> {mentorInfo.company.sector || '-'} | 
                  <strong> Çalışan Sayısı:</strong> {mentorInfo.company.employee_count || '-'}
                </p>
                <p className="mb-2">
                  <strong>İletişim Kişisi:</strong> {mentorInfo.contactPerson.name} ({mentorInfo.contactPerson.email})
                </p>
                <hr />
                <h6><FaUserTie className="me-2" />Mentorlar ({mentorInfo.mentors.length})</h6>
                <ul className="mb-0">
                  {mentorInfo.mentors.map(mentor => (
                    <li key={mentor.id}>
                      <strong>{mentor.name}</strong> - {mentor.title || 'Pozisyon belirtilmemiş'}
                      {mentor.department && ` (${mentor.department})`}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
            
            <div className="text-end mt-4">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => setShowAddModal(false)}
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={adding}
              >
                {adding ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Ekleniyor...
                  </>
                ) : (
                  'Şirketi Ekle'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Şirket Düzenleme Modalı */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Staj Şirketini Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}
          
          {editCompany && (
            <Form onSubmit={handleEditCompany}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Şirket Adı*</Form.Label>
                    <Form.Control
                      type="text"
                      value={editCompany.name}
                      onChange={(e) => setEditCompany({...editCompany, name: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kontenjan*</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      value={editCompany.available_positions}
                      onChange={(e) => setEditCompany({...editCompany, available_positions: parseInt(e.target.value)})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Lokasyon</Form.Label>
                    <Form.Control
                      type="text"
                      value={editCompany.location || ''}
                      onChange={(e) => setEditCompany({...editCompany, location: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Son Başvuru Tarihi</Form.Label>
                    <Form.Control
                      type="date"
                      value={editCompany.application_deadline ? new Date(editCompany.application_deadline).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditCompany({...editCompany, application_deadline: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Açıklama</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editCompany.description || ''}
                  onChange={(e) => setEditCompany({...editCompany, description: e.target.value})}
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Gereksinimler</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editCompany.requirements || ''}
                  onChange={(e) => setEditCompany({...editCompany, requirements: e.target.value})}
                  placeholder="Örn: Minimum GPA 3.0, Java bilgisi gerekli, vs."
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="company-status-switch"
                  label={editCompany.is_active ? "Aktif" : "Pasif"}
                  checked={editCompany.is_active}
                  onChange={(e) => setEditCompany({...editCompany, is_active: e.target.checked})}
                />
              </Form.Group>
              
              <div className="text-end mt-4">
                <Button 
                  variant="secondary" 
                  className="me-2"
                  onClick={() => setShowEditModal(false)}
                >
                  İptal
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={editing}
                >
                  {editing ? (
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
                    'Şirketi Güncelle'
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Şirket Silme Modalı */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Şirketi Sil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && <Alert variant="danger">{deleteError}</Alert>}
          
          {deleteCompany && (
            <p>
              <strong>{deleteCompany.name}</strong> şirketini silmek istediğinizden emin misiniz?
              <br />
              <small className="text-danger">Bu işlem geri alınamaz ve tüm yerleştirmeler etkilenebilir.</small>
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteCompany}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Siliniyor...
              </>
            ) : (
              'Evet, Sil'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CompanyManagement;