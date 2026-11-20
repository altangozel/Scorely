import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Badge, ProgressBar, Alert, Button, Spinner } from 'react-bootstrap';
import { FaChartLine, FaSync, FaGraduationCap, FaBriefcase, FaCode, FaLanguage } from 'react-icons/fa';
import { cvService } from '../../services/api';

const CVAnalysis = ({ refresh }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [refresh]);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await cvService.analyzeCV();
      setAnalysis(response.data.analysis);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Henüz bir CV yüklenmemiş. Lütfen önce CV yükleyin.');
      } else {
        setError('CV analizi alınamadı: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    setError('');
    
    try {
      const response = await cvService.reanalyzeCV();
      setAnalysis(response.data.analysis);
    } catch (err) {
      setError('CV yeniden analiz edilemedi: ' + (err.response?.data?.message || err.message));
    } finally {
      setReanalyzing(false);
    }
  };

  // Puan rengi
  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 40) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <Card.Body className="text-center p-5">
          <Spinner animation="border" role="status" variant="primary" />
          <p className="mt-3">CV analizi yükleniyor...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="mb-4">
        <Card.Body>
          <Alert variant="info">
            CV analiziniz henüz mevcut değil. Lütfen bir CV yükleyin.
          </Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Card.Title>
            <FaChartLine className="me-2" />
            CV Analizi
          </Card.Title>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={handleReanalyze}
            disabled={reanalyzing}
          >
            {reanalyzing ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Yeniden Analiz Ediliyor...
              </>
            ) : (
              <>
                <FaSync className="me-2" />
                Yeniden Analiz Et
              </>
            )}
          </Button>
        </div>

        {/* Toplam Puan */}
        <Row className="mb-4">
          <Col>
            <h5 className="text-center mb-3">Toplam CV Puanı</h5>
            <div className="position-relative">
              <ProgressBar 
                variant={getScoreColor(analysis.total_score)} 
                now={analysis.total_score} 
                className="progress-thick" 
                style={{ height: '25px' }}
              />
              <div 
                className="position-absolute top-50 start-50 translate-middle fw-bold"
                style={{ color: analysis.total_score > 50 ? 'white' : 'black' }}
              >
                {analysis.total_score}/100
              </div>
            </div>
            <div className="text-center mt-3">
              <Badge bg={getScoreColor(analysis.total_score)} className="px-3 py-2">
                {analysis.evaluation}
              </Badge>
            </div>
          </Col>
        </Row>

        {/* Alt Kategoriler */}
        <Row>
          {/* Beceriler */}
          <Col md={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <FaCode className="me-2 text-primary" />
                  Beceriler
                </Card.Title>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Beceri Puanı</span>
                    <span className={`text-${getScoreColor(analysis.skill_score)}`}>
                      {analysis.skill_score}/100
                    </span>
                  </div>
                  <ProgressBar 
                    variant={getScoreColor(analysis.skill_score)} 
                    now={analysis.skill_score} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <p>Tespit Edilen Beceriler: <strong>{analysis.skill_count}</strong></p>
                  <div>
                    {analysis.skills && analysis.skills.map((skill, index) => (
                      <Badge 
                        bg="primary" 
                        className="me-1 mb-1" 
                        key={index}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Deneyim */}
          <Col md={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <FaBriefcase className="me-2 text-info" />
                  İş Deneyimi
                </Card.Title>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Deneyim Puanı</span>
                    <span className={`text-${getScoreColor(analysis.experience_score)}`}>
                      {analysis.experience_score}/100
                    </span>
                  </div>
                  <ProgressBar 
                    variant={getScoreColor(analysis.experience_score)} 
                    now={analysis.experience_score} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <h5 className="text-center mt-3">
                    <Badge bg="info" className="px-3 py-2">
                      {analysis.experience_years} Yıl Deneyim
                    </Badge>
                  </h5>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Eğitim */}
          <Col md={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <FaGraduationCap className="me-2 text-success" />
                  Eğitim
                </Card.Title>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Eğitim Puanı</span>
                    <span className={`text-${getScoreColor(analysis.education_score)}`}>
                      {analysis.education_score}/100
                    </span>
                  </div>
                  <ProgressBar 
                    variant={getScoreColor(analysis.education_score)} 
                    now={analysis.education_score} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <h5 className="text-center mt-3">
                    <Badge bg="success" className="px-3 py-2">
                      {analysis.education_level === 'bachelors' && 'Lisans'}
                      {analysis.education_level === 'masters' && 'Yüksek Lisans'}
                      {analysis.education_level === 'doctorate' && 'Doktora'}
                      {analysis.education_level === 'associate' && 'Ön Lisans'}
                      {analysis.education_level === 'high_school' && 'Lise'}
                      {analysis.education_level === 'unknown' && 'Belirtilmemiş'}
                    </Badge>
                  </h5>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Dil Becerileri */}
          <Col md={6} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="d-flex align-items-center">
                  <FaLanguage className="me-2 text-warning" />
                  Dil Becerileri
                </Card.Title>
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Dil Puanı</span>
                    <span className={`text-${getScoreColor(analysis.language_score)}`}>
                      {analysis.language_score}/100
                    </span>
                  </div>
                  <ProgressBar 
                    variant={getScoreColor(analysis.language_score)} 
                    now={analysis.language_score} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  {analysis.languages && analysis.languages.length > 0 ? (
                    <ul className="list-group">
                      {analysis.languages.map((lang, index) => (
                        <li 
                          key={index} 
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>
                            {lang.language.charAt(0).toUpperCase() + lang.language.slice(1)}
                          </span>
                          <Badge bg="warning" text="dark">
                            {lang.level === 'native' && 'Ana Dili'}
                            {lang.level === 'advanced' && 'İleri Seviye'}
                            {lang.level === 'intermediate' && 'Orta Seviye'}
                            {lang.level === 'beginner' && 'Başlangıç'}
                            {lang.level === 'unknown' && 'Seviye Belirtilmemiş'}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center">Dil bilgisi tespit edilemedi.</p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* İyileştirme Önerileri */}
        {analysis.improvement_suggestions && analysis.improvement_suggestions.length > 0 && (
          <div className="mt-3">
            <h5>İyileştirme Önerileri</h5>
            <ul className="list-group">
              {analysis.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="list-group-item list-group-item-warning">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default CVAnalysis;