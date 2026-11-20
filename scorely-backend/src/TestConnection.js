// src/components/TestConnection.js
import React, { useState, useEffect } from 'react';
import { Button, Alert, Card } from 'react-bootstrap';
import api from '../services/api';

const TestConnection = () => {
  const [status, setStatus] = useState({ loading: false, message: '', error: false });

  const testApiConnection = async () => {
    setStatus({ loading: true, message: 'API bağlantısı test ediliyor...', error: false });
    
    try {
      const response = await api.get('/');
      setStatus({ 
        loading: false, 
        message: `Bağlantı başarılı! Sunucu yanıtı: ${response.data.message}`, 
        error: false 
      });
    } catch (error) {
      setStatus({ 
        loading: false, 
        message: `Bağlantı hatası: ${error.message}`, 
        error: true 
      });
      console.error('API bağlantı hatası:', error);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Card.Title>API Bağlantı Testi</Card.Title>
        
        {status.message && (
          <Alert variant={status.error ? 'danger' : 'success'}>
            {status.message}
          </Alert>
        )}
        
        <Button 
          variant="primary" 
          onClick={testApiConnection}
          disabled={status.loading}
        >
          {status.loading ? 'Test Ediliyor...' : 'API Bağlantısını Test Et'}
        </Button>
      </Card.Body>
    </Card>
  );
};

export default TestConnection;