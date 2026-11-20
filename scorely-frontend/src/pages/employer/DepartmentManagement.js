import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaBuilding, FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import { employerService } from '../../services/api';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager_name: '',
    manager_email: '',
    manager_phone: ''
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await employerService.getCompanyProfile();
      setDepartments(response.data.profile.Departments || []);
    } catch (err) {
      console.error('Departman yükleme hatası:', err);
      setError('Departmanlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await employerService.manageDepartments({
        action: 'create',
        department: formData
      });
      
      await loadDepartments();
      setShowAddModal(false);
      resetForm();
      alert('Departman başarıyla eklendi.');
    } catch (err) {
      console.error('Departman ekleme hatası:', err);
      alert('Departman eklenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditDepartment = async (e) => {
    e.preventDefault();
    if (!editingDepartment) return;
    
    setSaving(true);
    
    try {
      await employerService.manageDepartments({
        action: 'update',
        department_id: editingDepartment.id,
        updates: formData
      });
      
      await loadDepartments();
      setShowEditModal(false);
      setEditingDepartment(null);
      resetForm();
      alert('Departman başarıyla güncellendi.');
    } catch (err) {
      console.error('Departman güncelleme hatası:', err);
      alert('Departman güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!window.confirm('Bu departmanı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await employerService.manageDepartments({
        action: 'delete',
        department_id: departmentId
      });
      
      await loadDepartments();
      alert('Departman başarıyla silindi.');
    } catch (err) {
      console.error('Departman silme hatası:', err);
      alert('Departman silinirken bir hata oluştu.');
    }
  };

  const openEditModal = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || '',
      manager_name: department.manager_name || '',
      manager_email: department.manager_email || '',
      manager_phone: department.manager_phone || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      manager_name: '',
      manager_email: '',
      manager_phone: ''
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Departmanlar yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header as="h5" className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Departman Yönetimi</span>
            <Button 
              variant="light" 
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <FaPlus className="me-1" /> Yeni Departman Ekle
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {departments.length === 0 ? (
            <Alert variant="info">
              Henüz departman eklenmemiş. "Yeni Departman Ekle" butonunu kullanarak departman ekleyebilirsiniz.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Departman</th>
                    <th>Açıklama</th>
                    <th>Yönetici</th>
                    <th>İletişim</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>
                        <div>
                          <FaBuilding className="me-2 text-primary" />
                          <strong>{dept.name}</strong>
                        </div>
                      </td>
                      <td>{dept.description || '-'}</td>
                      <td>
                        {dept.manager_name ? (
                          <>
                            <FaUser className="me-1" />
                            {dept.manager_name}
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {dept.manager_email || dept.manager_phone ? (
                          <div>
                            {dept.manager_email && (
                              <>
                                <FaEnvelope className="me-1" /> 
                                <small>{dept.manager_email}</small>
                                <br />
                              </>
                            )}
                            {dept.manager_phone && (
                              <>
                                <FaPhone className="me-1" /> 
                                <small>{dept.manager_phone}</small>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <Badge bg={dept.is_active ? 'success' : 'secondary'}>
                          {dept.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => openEditModal(dept)}
                        >
                          <FaEdit /> Düzenle
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept.id)}
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

      {/* Departman Ekleme Modalı */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Departman Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddDepartment}>
            <Form.Group className="mb-3">
              <Form.Label>Departman Adı*</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>
            
            <hr />
            <h6>Yönetici Bilgileri</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Yönetici Adı</Form.Label>
              <Form.Control
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Yönetici E-posta</Form.Label>
              <Form.Control
                type="email"
                value={formData.manager_email}
                onChange={(e) => setFormData({...formData, manager_email: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Yönetici Telefon</Form.Label>
              <Form.Control
                type="tel"
                value={formData.manager_phone}
                onChange={(e) => setFormData({...formData, manager_phone: e.target.value})}
              />
            </Form.Group>
            
            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                İptal
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Ekleniyor...
                  </>
                ) : (
                  'Departman Ekle'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Departman Düzenleme Modalı */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Departman Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditDepartment}>
            <Form.Group className="mb-3">
              <Form.Label>Departman Adı*</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>
            
            <hr />
            <h6>Yönetici Bilgileri</h6>
            
            <Form.Group className="mb-3">
              <Form.Label>Yönetici Adı</Form.Label>
              <Form.Control
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({...formData, manager_name: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Yönetici E-posta</Form.Label>
              <Form.Control
                type="email"
                value={formData.manager_email}
                onChange={(e) => setFormData({...formData, manager_email: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Yönetici Telefon</Form.Label>
              <Form.Control
                type="tel"
                value={formData.manager_phone}
                onChange={(e) => setFormData({...formData, manager_phone: e.target.value})}
              />
            </Form.Group>
            
            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                İptal
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Güncelleniyor...
                  </>
                ) : (
                  'Güncelle'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DepartmentManagement;