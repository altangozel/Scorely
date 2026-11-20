import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FaFileAlt, FaDownload, FaTrash } from 'react-icons/fa';
import { cvService } from '../services/api';
import CVUpload from '../components/cv/CVUpload';
import CVAnalysis from '../components/cv/CVAnalysis';
import { useAuth } from '../context/AuthContext';

const CVManagement = () => {
  const { currentUser } = useAuth();
  const [cv, setCV] = useState(null);
  // loading değişkeni kullanıldı
  const [error, setError] = useState('');
  const [refreshAnalysis, setRefreshAnalysis] = useState(0);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  useEffect(() => {
    fetchUserCV();
  }, []);

  const fetchUserCV = async () => {
    let isLoading = true;
    setError('');
    
    try {
      const response = await cvService.getUserCV();
      setCV(response.data.cv);
    } catch (err) {
      if (err.response?.status === 404) {
        // 404 hatasını gerçek bir hata olarak kabul etmiyoruz, sadece CV'nin henüz yüklenmediğini gösteriyor
        setCV(null);
      } else {
        setError('CV bilgileri alınamadı: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      isLoading = false;
    }
  };

  const handleUploadSuccess = (uploadedCV) => {
    setCV(uploadedCV);
    setRefreshAnalysis(prev => prev + 1);
  };

  const handleDownloadCV = async () => {
    if (!cv) return;
    try {
      const res = await cvService.downloadCV(cv.id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = cv.original_filename || 'cv.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { setError('CV indirilemedi.'); }
  };

  const handleDeleteCV = async () => {
    if (!window.confirm('CV\'nizi silmek istediğinizden emin misiniz?')) {
      return;
    }

    setDeleteError('');
    setDeleteSuccess('');
    
    try {
      await cvService.deleteCV();
      setDeleteSuccess('CV başarıyla silindi.');
      setCV(null);
    } catch (err) {
      setDeleteError('CV silinirken hata oluştu: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">CV Yönetimi</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {deleteError && <Alert variant="danger">{deleteError}</Alert>}
      {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}
      
      <Row>
        <Col lg={4}>
          <CVUpload onUploadSuccess={handleUploadSuccess} />
          
          {cv && (
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>CV Bilgileri</Card.Title>
                <div className="d-flex align-items-center mb-3">
                  <FaFileAlt size={24} className={cv.file_type === 'pdf' ? 'text-danger me-2' : 'text-primary me-2'} />
                  <span>{cv.original_filename}</span>
                </div>

                <div className="d-flex">
                  <Button 
                    variant="primary" 
                    className="me-2"
                    onClick={handleDownloadCV}
                  >
                    <FaDownload className="me-2" />
                    İndir
                  </Button>
                  <Button 
                    variant="danger"
                    onClick={handleDeleteCV}
                  >
                    <FaTrash className="me-2" />
                    Sil
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
          
          <Card>
            <Card.Body>
              <Card.Title>Kullanıcı Bilgileri</Card.Title>
              <p><strong>Ad Soyad:</strong> {currentUser?.first_name} {currentUser?.last_name}</p>
              <p><strong>E-posta:</strong> {currentUser?.email}</p>
              <p>
                <strong>Kullanıcı Tipi:</strong> {
                  currentUser?.role === 'admin' ? 'Yönetici' :
                  currentUser?.role === 'employer' ? 'İşveren' :
                  currentUser?.role === 'university_coordinator' ? 'Üniversite Koordinatörü' :
                  currentUser?.role === 'student' ? 'Öğrenci/İş Arayan' : 
                  currentUser?.role
                }
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <CVAnalysis refresh={refreshAnalysis} />
        </Col>
      </Row>
    </Container>
  );
};

export default CVManagement;