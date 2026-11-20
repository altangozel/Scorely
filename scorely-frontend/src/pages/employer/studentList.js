import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { 
  FaCheck, FaTimes, FaEye, FaDownload, FaUser, FaEnvelope, 
  FaPhone, FaGraduationCap, FaFileAlt, FaUserTie 
} from 'react-icons/fa';
import { employerService, transcriptService } from '../../services/api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadStudents();
  }, [filter]);

  const loadStudents = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await employerService.getAssignedStudents(params);
      setStudents(response.data.students || []);
    } catch (err) {
      console.error('Öğrenci listesi yükleme hatası:', err);
      setError('Öğrenci listesi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (student, action) => {
    setSelectedStudent(student);
    setApprovalAction(action);
    setApprovalNotes('');
    setShowApprovalModal(true);
  };

  const handleApprovalUpdate = async () => {
    if (!selectedStudent || !approvalAction) return;
    
    setUpdating(true);
    
    try {
      await employerService.updateStudentApproval(selectedStudent.placement_id, {
        status: approvalAction,
        notes: approvalNotes
      });
      
      // Listeyi güncelle
      await loadStudents();
      setShowApprovalModal(false);
      
      // Başarı mesajı göster
      alert(`Öğrenci başarıyla ${approvalAction === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
    } catch (err) {
      console.error('Onay güncelleme hatası:', err);
      alert('Onay güncellenirken bir hata oluştu.');
    } finally {
      setUpdating(false);
    }
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <Badge bg="warning">Onay Bekliyor</Badge>,
      'approved': <Badge bg="success">Onaylandı</Badge>,
      'rejected': <Badge bg="danger">Reddedildi</Badge>
    };
    
    return badges[status] || <Badge bg="secondary">Bilinmiyor</Badge>;
  };

  const getPlacementTypeBadge = (type) => {
    return type === 'placed' ? 
      <Badge bg="primary">Normal Yerleştirme</Badge> : 
      <Badge bg="info">Alternatif Yerleştirme</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header as="h5" className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Stajyer Listesi</span>
            <div>
              <Form.Select 
                size="sm" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="d-inline-block w-auto"
              >
                <option value="all">Tümü</option>
                <option value="pending">Onay Bekleyen</option>
                <option value="approved">Onaylanan</option>
                <option value="rejected">Reddedilen</option>
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Öğrenciler yükleniyor...</p>
            </div>
          ) : students.length === 0 ? (
            <Alert variant="info">
              {filter === 'all' ? 
                'Henüz size atanan stajyer bulunmuyor.' : 
                `${filter === 'pending' ? 'Onay bekleyen' : filter === 'approved' ? 'Onaylanan' : 'Reddedilen'} stajyer bulunmuyor.`
              }
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Öğrenci</th>
                    <th>İletişim</th>
                    <th>Program</th>
                    <th>GPA</th>
                    <th>CV</th>
                    <th>Transkript</th>
                    <th>Yerleştirme</th>
                    <th>Mentor</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((item) => (
                    <tr key={item.placement_id}>
                      <td>
                        <div>
                          <strong>{item.student.name}</strong>
                          <br />
                          <small className="text-muted">ID: {item.student.id}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <FaEnvelope className="me-1" /> 
                          <small>{item.student.email}</small>
                          <br />
                          {item.student.phone && (
                            <>
                              <FaPhone className="me-1" /> 
                              <small>{item.student.phone}</small>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {item.program ? (
                          <div>
                            <small>{item.program.name}</small>
                            <br />
                            <Badge bg="secondary" size="sm">{item.program.code}</Badge>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        <Badge bg="info">
                          {item.student.gpa ? item.student.gpa.toFixed(2) : 'N/A'}
                        </Badge>
                      </td>
                      <td>
                        {item.student.cv ? (
                          <div>
                            <Badge bg="primary" className="mb-1">
                              Skor: {item.student.cv.total_score}
                            </Badge>
                            <br />
                            <small>{item.student.cv.education_level}</small>
                            <br />
                            <small>{item.student.cv.estimated_experience_years} yıl</small>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        {item.student.transcript ? (
                          <div>
                            <Badge bg={item.student.transcript.verified_by_coordinator ? "success" : "warning"}>
                              {item.student.transcript.verified_by_coordinator ? "Onaylı" : "Onaysız"}
                            </Badge>
                            {item.student.transcript.gpa && (
                              <>
                                <br />
                                <small>GPA: {item.student.transcript.gpa}</small>
                              </>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td>{getPlacementTypeBadge(item.placement_status)}</td>
                      <td>
                        {item.mentor ? (
                          <div>
                            <FaUserTie className="me-1" />
                            <small>{item.mentor.name}</small>
                            {item.department && (
                              <>
                                <br />
                                <small className="text-muted">{item.department.name}</small>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">Atanmadı</span>
                        )}
                      </td>
                      <td>{getStatusBadge(item.company_approval_status)}</td>
                      <td>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-1 mb-1"
                          onClick={() => openDetailModal(item)}
                        >
                          <FaEye /> Detay
                        </Button>
                        
                        {item.company_approval_status === 'pending' && (
                          <>
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-1 mb-1"
                              onClick={() => openApprovalModal(item, 'approved')}
                            >
                              <FaCheck /> Onayla
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="mb-1"
                              onClick={() => openApprovalModal(item, 'rejected')}
                            >
                              <FaTimes /> Reddet
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Onay Modalı */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {approvalAction === 'approved' ? 'Stajyeri Onayla' : 'Stajyeri Reddet'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <>
              <p>
                <strong>Öğrenci:</strong> {selectedStudent.student.name}
              </p>
              <Form.Group className="mb-3">
                <Form.Label>
                  {approvalAction === 'approved' ? 'Onay Notu' : 'Red Gerekçesi'}
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder={
                    approvalAction === 'approved' ? 
                    'Stajyer onaylandı. Başarılar dileriz.' : 
                    'Maalesef şu anda size uygun bir pozisyonumuz bulunmamaktadır.'
                  }
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
            İptal
          </Button>
          <Button
            variant={approvalAction === 'approved' ? 'success' : 'danger'}
            onClick={handleApprovalUpdate}
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
                İşleniyor...
              </>
            ) : approvalAction === 'approved' ? (
              <><FaCheck className="me-1" /> Onayla</>
            ) : (
              <><FaTimes className="me-1" /> Reddet</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detay Modalı */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Öğrenci Detayları</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <Row>
              <Col md={6}>
                <h5><FaUser className="me-2" />Kişisel Bilgiler</h5>
                <Table bordered size="sm">
                  <tbody>
                    <tr>
                      <td><strong>Ad Soyad:</strong></td>
                      <td>{selectedStudent.student.name}</td>
                    </tr>
                    <tr>
                      <td><strong>E-posta:</strong></td>
                      <td>{selectedStudent.student.email}</td>
                    </tr>
                    <tr>
                      <td><strong>Telefon:</strong></td>
                      <td>{selectedStudent.student.phone || 'Belirtilmemiş'}</td>
                    </tr>
                    <tr>
                      <td><strong>GPA:</strong></td>
                      <td>{selectedStudent.student.gpa?.toFixed(2) || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td><strong>Program:</strong></td>
                      <td>{selectedStudent.program?.name || 'Belirtilmemiş'}</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              
              <Col md={6}>
                <h5><FaGraduationCap className="me-2" />Akademik Bilgiler</h5>
                <Table bordered size="sm">
                  <tbody>
                    <tr>
                      <td><strong>CV Puanı:</strong></td>
                      <td>{selectedStudent.student.cv?.total_score || 0}/100</td>
                    </tr>
                    <tr>
                      <td><strong>Eğitim Seviyesi:</strong></td>
                      <td>{selectedStudent.student.cv?.education_level || 'Belirtilmemiş'}</td>
                    </tr>
                    <tr>
                      <td><strong>Deneyim:</strong></td>
                      <td>{selectedStudent.student.cv?.estimated_experience_years || 0} yıl</td>
                    </tr>
                    <tr>
                      <td><strong>Yerleştirme Tipi:</strong></td>
                      <td>{getPlacementTypeBadge(selectedStudent.placement_status)}</td>
                    </tr>
                    <tr>
                      <td><strong>Onay Durumu:</strong></td>
                      <td>{getStatusBadge(selectedStudent.company_approval_status)}</td>
                    </tr>
                    {selectedStudent.company_approval_date && (
                      <tr>
                        <td><strong>Onay Tarihi:</strong></td>
                        <td>{new Date(selectedStudent.company_approval_date).toLocaleDateString('tr-TR')}</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Col>
              
              {selectedStudent.student.cv?.extracted_skills && selectedStudent.student.cv.extracted_skills.length > 0 && (
                <Col md={12} className="mt-3">
                  <h5>Beceriler</h5>
                  <div>
                    {selectedStudent.student.cv.extracted_skills.map((skill, index) => (
                      <Badge key={index} bg="secondary" className="me-1 mb-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Col>
              )}
              
              <Col md={12} className="mt-3">
                <h5>Belgeler</h5>
                <div className="d-flex gap-2">
                  {selectedStudent.student.cv && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      href={`${apiBaseUrl}/api/cv/download/${selectedStudent.student.cv.id}`}
                      target="_blank"
                    >
                      <FaFileAlt className="me-1" /> CV İndir
                    </Button>
                  )}
                  {selectedStudent.student.transcript && (
                    <Button
                      variant="outline-success"
                      size="sm"
                      href={`${apiBaseUrl}/api/transcripts/download/${selectedStudent.student.transcript.id}`}
                      target="_blank"
                    >
                      <FaDownload className="me-1" /> Transkript İndir
                    </Button>
                  )}
                </div>
              </Col>
              
              {selectedStudent.mentor && (
                <Col md={12} className="mt-3">
                  <h5><FaUserTie className="me-2" />Mentor Bilgileri</h5>
                  <Table bordered size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Mentor:</strong></td>
                        <td>{selectedStudent.mentor.name}</td>
                      </tr>
                      <tr>
                        <td><strong>E-posta:</strong></td>
                        <td>{selectedStudent.mentor.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Telefon:</strong></td>
                        <td>{selectedStudent.mentor.phone}</td>
                      </tr>
                      {selectedStudent.department && (
                        <tr>
                          <td><strong>Departman:</strong></td>
                          <td>{selectedStudent.department.name}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Kapat
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StudentList;