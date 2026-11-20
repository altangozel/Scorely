import React, { useState } from 'react';
import { Card, Form, Button, Alert, ProgressBar } from 'react-bootstrap';
import { FaUpload, FaFilePdf, FaFileWord } from 'react-icons/fa';
import { cvService } from '../../services/api';

const CVUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type;
      if (
        fileType === 'application/pdf' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'application/msword'
      ) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Lütfen PDF veya Word (DOC/DOCX) formatında bir CV yükleyin.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Lütfen bir dosya seçin.');
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);

    setLoading(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      // Yükleme simülasyonu
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(interval);
            return 90;
          }
          return newProgress;
        });
      }, 200);

      const response = await cvService.uploadCV(formData);
      
      clearInterval(interval);
      setProgress(100);
      setSuccess('CV başarıyla yüklendi!');
      
      // Parent component'e bildiriyoruz ki CV'nin durumu güncellensin
      if (onUploadSuccess && typeof onUploadSuccess === 'function') {
        onUploadSuccess(response.data.cv);
      }
    } catch (err) {
      setError('CV yükleme hatası: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    const fileType = file.type;
    if (fileType === 'application/pdf') {
      return <FaFilePdf size={24} className="text-danger me-2" />;
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileType === 'application/msword'
    ) {
      return <FaFileWord size={24} className="text-primary me-2" />;
    }
    return null;
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>CV Yükle</Card.Title>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <div className="d-flex align-items-center mb-2">
              {getFileIcon()}
              <Form.Label>
                {file ? file.name : 'CV dosyasını seçin (PDF veya DOCX)'}
              </Form.Label>
            </div>
            
            <div className="input-group">
              <Form.Control
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                disabled={loading}
                required
              />
              <Button 
                variant="primary" 
                type="submit" 
                disabled={!file || loading}
              >
                <FaUpload className="me-2" />
                {loading ? 'Yükleniyor...' : 'Yükle'}
              </Button>
            </div>
          </Form.Group>
          
          {loading && (
            <ProgressBar 
              animated 
              now={progress} 
              label={`${progress}%`} 
              className="mt-2" 
            />
          )}
          
          <div className="text-muted small mt-2">
            <p className="mb-0">Desteklenen formatlar: PDF, DOC, DOCX</p>
            <p className="mb-0">Maksimum dosya boyutu: 5MB</p>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CVUpload;