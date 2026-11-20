// src/pages/coordinator/ProgramCodes.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaToggleOn, FaToggleOff, FaCopy } from 'react-icons/fa';
import api from '../../services/api';

const ProgramCodes = () => {
  const [programCodes, setProgramCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProgram, setNewProgram] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [toggleLoading, setToggleLoading] = useState(null);
  const [copySuccess, setCopySuccess] = useState('');

  // Program kodlarını yükle
  const loadProgramCodes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/program-codes');
      setProgramCodes(response.data.program_codes || []);
    } catch (err) {
      console.error('Program kodları yükleme hatası:', err);
      setError('Program kodları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede program kodlarını getir
  useEffect(() => {
    loadProgramCodes();
  }, []);

  // Yeni program oluştur
  const handleCreateProgram = async (e) => {
    e.preventDefault();
    
    if (!newProgram.name) {
      setCreateError('Program adı gereklidir.');
      return;
    }
    
    setCreating(true);
    setCreateError('');
    setCreateSuccess('');
    
    try {
      const response = await api.post('/program-codes/create', newProgram);
      setProgramCodes(prev => [response.data.program_code, ...prev]);
      setCreateSuccess('Program kodu başarıyla oluşturuldu.');
      
      // Formu temizle
      setNewProgram({ name: '', description: '' });
      
      // Modalı kapat
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Program oluşturma hatası:', err);
      setCreateError('Program oluşturulurken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  // Program durumunu değiştir (aktif/pasif)
  const toggleProgramStatus = async (id) => {
    setToggleLoading(id);
    
    try {
      const response = await api.put(`/program-codes/${id}/toggle`);
      
      // Program kodlarını güncelle
      setProgramCodes(prev => 
        prev.map(code => 
          code.id === id ? response.data.program_code : code
        )
      );
    } catch (err) {
      console.error('Program durumu değiştirme hatası:', err);
      alert('Program durumu değiştirilirken bir hata oluştu.');
    } finally {
      setToggleLoading(null);
    }
  };

  // Kod kopyalama
  const copyCodeToClipboard = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopySuccess(`Kod (${code}) panoya kopyalandı!`);
        setTimeout(() => setCopySuccess(''), 3000);
      })
      .catch(() => {
        alert('Kod kopyalanamadı.');
      });
  };

  // Formatta tarih 
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span>Program Kodları Yönetimi</span>
            <Button 
              variant="light" 
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus className="me-1" /> Yeni Program Kodu
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {copySuccess && (
            <Alert variant="success" dismissible onClose={() => setCopySuccess('')}>
              {copySuccess}
            </Alert>
          )}
          
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Program kodları yükleniyor...</p>
            </div>
          ) : programCodes.length === 0 ? (
            <Alert variant="info">
              Henüz program kodu oluşturmadınız. Öğrencilerin staj başvurusu yapabilmesi için bir program kodu oluşturun.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Program Adı</th>
                    <th>Kod</th>
                    <th>Açıklama</th>
                    <th>Durum</th>
                    <th>Oluşturulma Tarihi</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {programCodes.map(program => (
                    <tr key={program.id}>
                      <td>{program.name}</td>
                      <td>
                        <code>{program.code}</code>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="ms-2"
                          onClick={() => copyCodeToClipboard(program.code)}
                        >
                          <FaCopy />
                        </Button>
                      </td>
                      <td>{program.description || '-'}</td>
                      <td>
                        <Badge bg={program.is_active ? 'success' : 'secondary'}>
                          {program.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </td>
                      <td>{formatDate(program.created_at)}</td>
                      <td>
                        <Button
                          variant={program.is_active ? 'outline-warning' : 'outline-success'}
                          size="sm"
                          onClick={() => toggleProgramStatus(program.id)}
                          disabled={toggleLoading === program.id}
                        >
                          {toggleLoading === program.id ? (
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                          ) : program.is_active ? (
                            <><FaToggleOn className="me-1" /> Pasif Yap</>
                          ) : (
                            <><FaToggleOff className="me-1" /> Aktif Yap</>
                          )}
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

      {/* Yeni Program Kodu Oluşturma Modalı */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Yeni Program Kodu Oluştur</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <Alert variant="danger">{createError}</Alert>}
          {createSuccess && <Alert variant="success">{createSuccess}</Alert>}
          
          <Form onSubmit={handleCreateProgram}>
            <Form.Group className="mb-3">
              <Form.Label>Program Adı*</Form.Label>
              <Form.Control
                type="text"
                placeholder="Örn: 2024 Yaz Stajı"
                value={newProgram.name}
                onChange={(e) => setNewProgram({...newProgram, name: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Açıklama</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Staj programı hakkında bilgi"
                value={newProgram.description}
                onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
              />
            </Form.Group>
            
            <div className="text-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => setShowCreateModal(false)}
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>Oluştur</>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default ProgramCodes;