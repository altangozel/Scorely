import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaUserTie, FaEnvelope, FaPhone, FaBuilding } from 'react-icons/fa';
import { employerService } from '../../services/api';

const MentorManagement = () => {
  const [mentors, setMentors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMentor, setEditingMentor] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [students, setStudents] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    department_id: ''
  });
  
  const [assignData, setAssignData] = useState({
    mentor_id: '',
    student_id: '',
    placement_id: '',
    notes: ''
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Şirket profilini al (mentorlar ve departmanlar dahil)
      const profileResponse = await employerService.getCompanyProfile();
      const profile = profileResponse.data.profile;
      
      setMentors(profile.Mentors || []);
      setDepartments(profile.Departments || []);
      
      // Atama yapılabilecek öğrencileri al
      const studentsResponse = await employerService.getAssignedStudents({ status: 'approved' });
      setStudents(studentsResponse.data.students || []);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      setError('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMentor = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await employerService.manageMentors({
        action: 'create',
        mentor: formData
      });
      
      await loadData();
      setShowAddModal(false);
      resetForm();
      alert('Mentor başarıyla eklendi.');
    } catch (err) {
      console.error('Mentor ekleme hatası:', err);
      alert('Mentor eklenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditMentor = async (e) => {
    e.preventDefault();
    if (!editingMentor) return;
    
    setSaving(true);
    
    try {
      await employerService.manageMentors({
        action: 'update',
        mentor_id: editingMentor.id,
        updates: formData
      });
      
      await loadData();
      setShowEditModal(false);
      setEditingMentor(null);
      resetForm();
      alert('Mentor başarıyla güncellendi.');
    } catch (err) {
      console.error('Mentor güncelleme hatası:', err);
      alert('Mentor güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMentor = async (mentorId) => {
    if (!window.confirm('Bu mentoru silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await employerService.manageMentors({
        action: 'update',
        mentor_id: mentorId,
        updates: { is_active: false }
      });
      
      await loadData();
      alert('Mentor başarıyla silindi.');
    } catch (err) {
      console.error('Mentor silme hatası:', err);
      alert('Mentor silinirken bir hata oluştu.');
    }
  };

  const handleAssignMentor = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await employerService.manageMentors({
        action: 'assign',
        ...assignData
      });
      
      await loadData();
      setShowAssignModal(false);
      setAssignData({
        mentor_id: '',
        student_id: '',
        placement_id: '',
        notes: ''
      });
      alert('Mentor ataması başarıyla yapıldı.');
    } catch (err) {
      console.error('Mentor atama hatası:', err);
      alert('Mentor ataması yapılırken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (mentor) => {
    setEditingMentor(mentor);
    setFormData({
      name: mentor.name,
      email: mentor.email,
      phone: mentor.phone,
      title: mentor.title || '',
      department_id: mentor.department_id || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      title: '',
      department_id: ''
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Veriler yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header as="h5" className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Mentor Yönetimi</span>
            <div>
              <Button 
                variant="success" 
                size="sm"
                className="me-2"
                onClick={() => setShowAssignModal(true)}
                disabled={mentors.length === 0 || students.length === 0}
              >
                <FaUserTie className="me-1" /> Mentor Ata
              </Button>
              <Button 
                variant="light" 
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <FaPlus className="me-1" /> Yeni Mentor Ekle
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {mentors.length === 0 ? (
            <Alert variant="info">
              Henüz mentor eklenmemiş. "Yeni Mentor Ekle" butonunu kullanarak mentor ekleyebilirsiniz.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Mentor</th>
                    <th>İletişim</th>
                    <th>Departman</th>
                    <th>Unvan</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.map((mentor) => (
                    <tr key={mentor.id}>
                      <td>
                        <div>
                          <FaUserTie className="me-2 text-primary" />
                          <strong>{mentor.name}</strong>
                        </div>
                      </td>
                      <td>
                        <div>
                          <FaEnvelope className="me-1" /> {mentor.email}
                          <br />
                          <FaPhone className="me-1" /> {mentor.phone}
                        </div>
                      </td>
                      <td>
                        {mentor.Department ? (
                          <>
                            <FaBuilding className="me-1" />
                            {mentor.Department.name}
                          </>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{mentor.title || '-'}</td>
                      <td>
                        <Badge bg={mentor.is_active ? 'success' : 'secondary'}>
                          {mentor.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => openEditModal(mentor)}
                        >
                          <FaEdit /> Düzenle
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteMentor(mentor.id)}
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

      {/* Mentor Ekleme Modalı */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Mentor Ekle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddMentor}>
            <Form.Group className="mb-3">
              <Form.Label>Ad Soyad*</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>E-posta*</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Telefon*</Form.Label>
              <Form.Control
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Unvan</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Örn: Yazılım Geliştirme Uzmanı"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Departman</Form.Label>
              <Form.Select
                value={formData.department_id}
                onChange={(e) => setFormData({...formData, department_id: e.target.value})}
              >
                <option value="">Seçiniz...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Form.Select>
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
                  'Mentor Ekle'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Mentor Düzenleme Modalı */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mentor Düzenle</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditMentor}>
            <Form.Group className="mb-3">
              <Form.Label>Ad Soyad*</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>E-posta*</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Telefon*</Form.Label>
              <Form.Control
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Unvan</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Departman</Form.Label>
              <Form.Select
                value={formData.department_id}
                onChange={(e) => setFormData({...formData, department_id: e.target.value})}
              >
                <option value="">Seçiniz...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </Form.Select>
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

      {/* Mentor Atama Modalı */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Mentor Ata</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssignMentor}>
            <Form.Group className="mb-3">
              <Form.Label>Öğrenci*</Form.Label>
              <Form.Select
                value={assignData.student_id}
                onChange={(e) => {
                  const studentId = e.target.value;
                  const student = students.find(s => s.student.id == studentId);
                  setAssignData({
                    ...assignData,
                    student_id: studentId,
                    placement_id: student ? student.placement_id : ''
                  });
                }}
                required
              >
                <option value="">Seçiniz...</option>
                {students.map(item => (
                  <option key={item.student.id} value={item.student.id}>
                    {item.student.name} - {item.mentor ? `(Mevcut: ${item.mentor.name})` : '(Mentor Yok)'}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Mentor*</Form.Label>
              <Form.Select
                value={assignData.mentor_id}
                onChange={(e) => setAssignData({...assignData, mentor_id: e.target.value})}
                required
              >
                <option value="">Seçiniz...</option>
                {mentors.filter(m => m.is_active).map(mentor => (
                  <option key={mentor.id} value={mentor.id}>
                    {mentor.name} {mentor.Department ? `- ${mentor.Department.name}` : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Not</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={assignData.notes}
                onChange={(e) => setAssignData({...assignData, notes: e.target.value})}
                placeholder="Atama ile ilgili notlar..."
              />
            </Form.Group>
            
            <div className="text-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowAssignModal(false)}>
                İptal
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Atanıyor...
                  </>
                ) : (
                  'Mentor Ata'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MentorManagement;