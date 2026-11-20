// src/components/student/GPAUpdate.js
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaEdit } from 'react-icons/fa';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const GPAUpdate = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const [gpa, setGpa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser?.gpa) {
      setGpa(currentUser.gpa.toString());
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (gpa === '' || isNaN(gpa) || parseFloat(gpa) < 0 || parseFloat(gpa) > 4.0) {
      setError('Lütfen 0-4.0 arasında geçerli bir GPA giriniz.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await userService.updateGPA({ gpa: parseFloat(gpa) });
      setSuccess('GPA başarıyla güncellendi.');
      
      // Context'teki kullanıcı bilgisini güncelle
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          gpa: parseFloat(gpa)
        });
      }
    } catch (err) {
      console.error('GPA güncelleme hatası:', err);
      setError('GPA güncellenirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">
          <FaUser className="me-2" />
          Genel Not Ortalaması (GPA)
        </h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>GPA (0-4.0)</Form.Label>
            <Form.Control
              type="number"
              min="0"
              max="4.0"
              step="0.01"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              GPA değerinizi 0 ile 4.0 arasında giriniz. Staj yerleştirmelerinde GPA değeriniz dikkate alınacaktır.
            </Form.Text>
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
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
              <><FaEdit className="me-2" /> GPA'yı Güncelle</>
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default GPAUpdate;