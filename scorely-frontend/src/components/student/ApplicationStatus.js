// components/student/ApplicationStatus.js
import React from 'react';
import { Card, Badge, ProgressBar, Alert } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaClock, FaUserTie } from 'react-icons/fa';

const ApplicationStatus = ({ application }) => {
  // İlerleme yüzdesini hesapla
  const getProgress = () => {
    if (application.coordinator_status === 'rejected') return 50;
    if (application.coordinator_status === 'pending') return 25;
    if (application.coordinator_status === 'approved') return 100;
    return 0;
  };
  
  const progress = getProgress();
  
  return (
    <Card className="mb-3">
      <Card.Header>
        <h6 className="mb-0">{application.ProgramCode?.name || 'Staj Programı'}</h6>
      </Card.Header>
      <Card.Body>
        {/* İlerleme Çubuğu */}
        <div className="mb-4">
          <ProgressBar now={progress} variant={
            application.coordinator_status === 'rejected' ? 'danger' :
            progress === 100 ? 'success' : 'info'
          } />
        </div>
        
        {/* Aşamalar */}
        <div className="d-flex justify-content-between mb-4">
          {/* Başvuru */}
          <div className="text-center">
            <div className={`rounded-circle p-2 mb-2 ${
              'bg-success text-white'
            }`}>
              <FaCheckCircle size={20} />
            </div>
            <small>Başvuru</small>
          </div>
          
          {/* Koordinatör Onayı */}
          <div className="text-center">
            <div className={`rounded-circle p-2 mb-2 ${
              application.coordinator_status === 'approved' ? 'bg-success text-white' :
              application.coordinator_status === 'rejected' ? 'bg-danger text-white' :
              'bg-warning text-white'
            }`}>
              {application.coordinator_status === 'approved' ? <FaCheckCircle size={20} /> :
               application.coordinator_status === 'rejected' ? <FaTimesCircle size={20} /> :
               <FaClock size={20} />}
            </div>
            <small>Koordinatör Onayı</small>
          </div>
        </div>
        
        {/* Durum Mesajı */}
        <Alert variant={
          application.coordinator_status === 'rejected' ? 'danger' :
          application.coordinator_status === 'approved' ? 'success' :
          'info'
        }>
          <strong>Durum:</strong> {
            application.coordinator_status === 'pending' ? 'Koordinatör onayı bekliyor' :
            application.coordinator_status === 'rejected' ? 'Koordinatör tarafından reddedildi' :
            application.coordinator_status === 'approved' ? 'Staj başvurusu onaylandı! Şirket Tercihleri sayfasından tercihlerinizi yapabilirsiniz.' :
            'Bilinmiyor'
          }
        </Alert>
        
        {/* Notlar */}
        {application.coordinator_notes && (
          <div className="mb-3">
            <strong><FaUserTie className="me-1" /> Koordinatör Notu:</strong>
            <p className="mb-0 mt-1">{application.coordinator_notes}</p>
          </div>
        )}
        
        {/* Tarihler */}
        <div className="mt-3 text-muted small">
          <div>Başvuru Tarihi: {new Date(application.created_at).toLocaleDateString('tr-TR')}</div>
          {application.coordinator_reviewed_at && (
            <div>Koordinatör İnceleme: {new Date(application.coordinator_reviewed_at).toLocaleDateString('tr-TR')}</div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default ApplicationStatus;