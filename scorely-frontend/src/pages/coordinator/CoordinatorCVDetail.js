import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Card, Badge, Form, Button, 
  Pagination, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaEye, FaTag, FaDownload } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CoordinatorCVList = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // CV'leri yükle
  const loadCVs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const offset = (currentPage - 1) * itemsPerPage;
      
      const response = await api.get(`/coordinator/cvs`, {
        params: {
          sort: sortOrder,
          limit: itemsPerPage,
          offset,
          search: searchTerm
        }
      });
      
      setCvs(response.data.cvs);
      setTotalItems(response.data.total);
    } catch (err) {
      console.error('CV\'leri yükleme hatası:', err);
      setError('CV\'leri yüklerken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme ve filtre değişikliklerinde CV'leri yeniden yükle
  useEffect(() => {
    loadCVs();
  }, [currentPage, itemsPerPage, sortOrder, searchTerm]);

  // Skorları görsel renk skalasına çevir
  const getScoreColorClass = (score) => {
    if (score >= 90) return 'bg-success text-white';
    if (score >= 75) return 'bg-info text-white';
    if (score >= 60) return 'bg-primary text-white';
    if (score >= 40) return 'bg-warning';
    return 'bg-danger text-white';
  };

  // Eğitim seviyesini Türkçe'ye çevir
  const getEducationLevelText = (level) => {
    const levels = {
      'doctorate': 'Doktora',
      'masters': 'Yüksek Lisans',
      'bachelors': 'Lisans',
      'associate': 'Ön Lisans',
      'high_school': 'Lise',
      'unknown': 'Belirtilmemiş'
    };
    
    return levels[level] || 'Belirtilmemiş';
  };

  // CV detaylarını görüntüle
  const viewCVDetails = (id) => {
    navigate(`/coordinator/cv/${id}`);
  };

  // CV indir
  const downloadCV = async (id) => {
    try {
      const response = await api.get(`/cv/download/${id}`, {
        responseType: 'blob'
      });
      
      // Dosyayı indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Dosya adını response header'dan al veya varsayılan kullan
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'cv-document';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          filename = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CV indirme hatası:', err);
      alert('CV indirilirken bir hata oluştu!');
    }
  };
  
  // Sıralama değiştir
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  // Sayfalama
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const renderPagination = () => {
    const items = [];
    
    // Sayfa sayısı 10'dan fazlaysa kısaltılmış pagination göster
    if (totalPages > 10) {
      // İlk sayfa
      items.push(
        <Pagination.Item 
          key={1} 
          active={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          1
        </Pagination.Item>
      );
      
      // Eğer mevcut sayfa 4 veya daha büyükse, ellipsis göster
      if (currentPage > 3) {
        items.push(<Pagination.Ellipsis key="ellipsis-1" />);
      }
      
      // Mevcut sayfanın etrafındaki sayfalar
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let page = startPage; page <= endPage; page++) {
        items.push(
          <Pagination.Item 
            key={page} 
            active={currentPage === page}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Pagination.Item>
        );
      }
      
      // Eğer mevcut sayfa son 3 sayfadan önceyse, ellipsis göster
      if (currentPage < totalPages - 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-2" />);
      }
      
      // Son sayfa
      if (totalPages > 1) {
        items.push(
          <Pagination.Item 
            key={totalPages} 
            active={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    } else {
      // 10 sayfadan az ise, tüm sayfaları göster
      for (let page = 1; page <= totalPages; page++) {
        items.push(
          <Pagination.Item 
            key={page} 
            active={currentPage === page}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Pagination.Item>
        );
      }
    }
    
    return (
      <Pagination>
        <Pagination.Prev
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        />
      </Pagination>
    );
  };

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          <Row className="align-items-center">
            <Col>CV Listesi</Col>
            <Col xs="auto">
              <Badge bg="light" text="dark">
                Toplam: {totalItems} CV
              </Badge>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {/* Arama ve Filtreleme */}
          <Row className="mb-4">
            <Col md={6}>
              <InputGroup>
                <Form.Control
                  placeholder="İsim, soyisim veya email ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="outline-secondary">
                  <FaSearch /> Ara
                </Button>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Select 
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                >
                  <option value={5}>5 kayıt</option>
                  <option value={10}>10 kayıt</option>
                  <option value={25}>25 kayıt</option>
                  <option value={50}>50 kayıt</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="text-end">
              <Button 
                variant="outline-primary"
                onClick={toggleSortOrder}
              >
                Skor {sortOrder === 'desc' ? 
                  <FaSortDown className="ms-1" /> : 
                  <FaSortUp className="ms-1" />}
              </Button>
            </Col>
          </Row>

          {/* Hata Gösterimi */}
          {error && (
            <Alert variant="danger">
              {error}
            </Alert>
          )}

          {/* Yükleniyor */}
          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Yükleniyor...</span>
              </Spinner>
              <p className="mt-2">CV'ler yükleniyor...</p>
            </div>
          )}

          {/* CV Tablosu */}
          {!loading && cvs.length === 0 && (
            <Alert variant="info">
              Gösterilecek CV bulunamadı. Filtreleri değiştirerek tekrar deneyin.
            </Alert>
          )}

          {!loading && cvs.length > 0 && (
            <>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Ad Soyad</th>
                      <th>Eğitim Seviyesi</th>
                      <th>Deneyim (Yıl)</th>
                      <th>Beceriler</th>
                      <th>Skor</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cvs.map((cv) => (
                      <tr key={cv.id}>
                        <td>{cv.user.first_name} {cv.user.last_name}</td>
                        <td>{getEducationLevelText(cv.education_level)}</td>
                        <td>{cv.experience_years || 0}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '300px' }}>
                            {cv.skills.slice(0, 5).map((skill, index) => (
                              <Badge key={index} bg="secondary" className="me-1">
                                {skill}
                              </Badge>
                            ))}
                            {cv.skills.length > 5 && (
                              <Badge bg="light" text="dark">
                                +{cv.skills.length - 5}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <Badge className={getScoreColorClass(cv.total_score)}>
                            {cv.total_score || 0}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            className="me-1"
                            onClick={() => viewCVDetails(cv.id)}
                          >
                            <FaEye /> İncele
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            className="me-1"
                            onClick={() => downloadCV(cv.id)}
                          >
                            <FaDownload /> İndir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Sayfalama */}
              <div className="d-flex justify-content-center mt-4">
                {renderPagination()}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CoordinatorCVList;