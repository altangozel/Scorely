import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Card, Badge, Form, Button, 
 Pagination, Spinner, Alert, InputGroup, Modal } from 'react-bootstrap';
import { FaSort, FaSortUp, FaSortDown, FaSearch, FaEye, FaDownload, FaTrash } from 'react-icons/fa';
import { coordinatorService } from '../../services/api';

const CoordinatorCVList = () => {
 const [cvs, setCvs] = useState([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState(null);
 const [sortOrder, setSortOrder] = useState('desc');
 const [searchTerm, setSearchTerm] = useState('');
 const [currentPage, setCurrentPage] = useState(1);
 const [totalItems, setTotalItems] = useState(0);
 const [itemsPerPage, setItemsPerPage] = useState(10);
 
 // Silme modalı için state
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [cvToDelete, setCvToDelete] = useState(null);
 const [deleting, setDeleting] = useState(false);
 const [deleteError, setDeleteError] = useState('');
 const [deleteSuccess, setDeleteSuccess] = useState('');
 
 const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

 // CV'leri yükle
 const loadCVs = async () => {
   setLoading(true);
   setError(null);
   
   try {
     const offset = (currentPage - 1) * itemsPerPage;
     
     const response = await coordinatorService.getAllCVs({
       sort: sortOrder,
       limit: itemsPerPage,
       offset,
       search: searchTerm
     });
     
     setCvs(response.data.cvs || []);
     setTotalItems(response.data.total || 0);
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
 }, [currentPage, itemsPerPage, sortOrder]);

 // Arama formunu submit etme
 const handleSearchSubmit = (e) => {
   e.preventDefault();
   loadCVs();
 };

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

 // CV silme modalını göster
 const showDeleteConfirmation = (cv) => {
   setCvToDelete(cv);
   setShowDeleteModal(true);
 };

 // CV silme işlemi
 const handleDeleteCV = async () => {
   if (!cvToDelete) return;
   
   setDeleting(true);
   setDeleteError('');
   
   try {
     await coordinatorService.deleteCV(cvToDelete.id);
     setDeleteSuccess('CV başarıyla silindi.');
     
     // CV'yi listeden çıkar
     setCvs(prevCvs => prevCvs.filter(cv => cv.id !== cvToDelete.id));
     
     // Toplam sayıyı güncelle
     setTotalItems(prevTotal => prevTotal - 1);
     
     // Modalı kapat
     setTimeout(() => {
       setShowDeleteModal(false);
       setCvToDelete(null);
       setDeleteSuccess('');
     }, 1500);
   } catch (err) {
     console.error('CV silme hatası:', err);
     setDeleteError('CV silinirken bir hata oluştu: ' + (err.response?.data?.message || err.message));
   } finally {
     setDeleting(false);
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
             <Form onSubmit={handleSearchSubmit}>
               <InputGroup>
                 <Form.Control
                   placeholder="İsim, soyisim veya email ara..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <Button variant="outline-secondary" type="submit">
                   <FaSearch /> Ara
                 </Button>
               </InputGroup>
             </Form>
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
                           {cv.skills && cv.skills.slice(0, 5).map((skill, index) => (
                             <Badge key={index} bg="secondary" className="me-1">
                               {skill}
                             </Badge>
                           ))}
                           {cv.skills && cv.skills.length > 5 && (
                             <Badge bg="light" text="dark">
                               +{cv.skills.length - 5}
                             </Badge>
                           )}
                           {(!cv.skills || cv.skills.length === 0) && (
                             <span className="text-muted">Beceri bulunamadı</span>
                           )}
                         </div>
                       </td>
                       <td>
                         <Badge className={getScoreColorClass(cv.total_score)}>
                           {cv.total_score || 0}
                         </Badge>
                       </td>
                       <td>
                         <a 
                           href={`/coordinator/cv/${cv.id}`}
                           className="btn btn-outline-primary btn-sm me-1"
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           <FaEye /> İncele
                         </a>
                         <a 
                           href={`${apiBaseUrl}/api/cv/download/${cv.id}`}
                           className="btn btn-outline-success btn-sm me-1"
                           target="_blank"
                           rel="noopener noreferrer"
                         >
                           <FaDownload /> İndir
                         </a>
                         <Button
                           variant="outline-danger"
                           size="sm"
                           onClick={() => showDeleteConfirmation(cv)}
                         >
                           <FaTrash /> Sil
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

     {/* Silme Onay Modalı */}
     <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
       <Modal.Header closeButton>
         <Modal.Title>CV'yi Sil</Modal.Title>
       </Modal.Header>
       <Modal.Body>
         {deleteError && <Alert variant="danger">{deleteError}</Alert>}
         {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}
         
         {!deleteSuccess && (
           <p>
             <strong>{cvToDelete?.user?.first_name} {cvToDelete?.user?.last_name}</strong> adlı kişiye
             ait CV'yi silmek istediğinize emin misiniz?
             <br />
             <small className="text-danger">Bu işlem geri alınamaz.</small>
           </p>
         )}
       </Modal.Body>
       <Modal.Footer>
         {!deleteSuccess && (
           <>
             <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
               İptal
             </Button>
             <Button 
               variant="danger" 
               onClick={handleDeleteCV}
               disabled={deleting}
             >
               {deleting ? (
                 <>
                   <Spinner
                     as="span"
                     animation="border"
                     size="sm"
                     role="status"
                     aria-hidden="true"
                     className="me-2"
                   />
                   Siliniyor...
                 </>
               ) : (
                 <>
                   <FaTrash className="me-2" />
                   Evet, Sil
                 </>
               )}
             </Button>
           </>
         )}
         {deleteSuccess && (
           <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
             Kapat
           </Button>
         )}
       </Modal.Footer>
     </Modal>
   </Container>
 );
};

export default CoordinatorCVList;