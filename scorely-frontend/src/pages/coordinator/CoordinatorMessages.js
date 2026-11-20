// src/pages/coordinator/CoordinatorMessages.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Button, Form, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { 
  FaEnvelope, FaReply, FaUser, FaClock, FaCheckDouble, 
  FaPaperPlane, FaInbox, FaFilter, FaBuilding, FaUserTie, FaPlus 
} from 'react-icons/fa';
import { messageService } from '../../services/api';

const CoordinatorMessages = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sending, setSending] = useState(false);
  
  // Yeni mesaj modalı
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [newMessage, setNewMessage] = useState({
    receiver_id: '',
    subject: '',
    message: '',
    message_type: 'general'
  });
  
  // Reply form
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyData, setReplyData] = useState({
    receiver_id: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, filter]);

  const loadMessages = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await messageService.getMessagesForCoordinator();
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Mesaj yükleme hatası:', err);
      setError('Mesajlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const loadMentors = async () => {
    setLoadingMentors(true);
    
    try {
      const response = await messageService.getAvailableMentors();
      setMentors(response.data.mentors || []);
    } catch (err) {
      console.error('Mentor listesi yükleme hatası:', err);
      alert('Mentor listesi yüklenirken bir hata oluştu.');
    } finally {
      setLoadingMentors(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];
    
    switch (filter) {
      case 'unread':
        filtered = messages.filter(m => !m.is_read && m.receiver_id === m.currentUserId);
        break;
      case 'sent':
        filtered = messages.filter(m => m.sender_id === m.currentUserId);
        break;
      case 'received':
        filtered = messages.filter(m => m.receiver_id === m.currentUserId);
        break;
      case 'company':
        filtered = messages.filter(m => m.sender_company || (m.Sender && m.Sender.role_id === 2)); // employer role
        break;
      default:
        break;
    }
    
    setFilteredMessages(filtered);
  };

  const handleNewMessage = () => {
    setNewMessage({
      receiver_id: '',
      subject: '',
      message: '',
      message_type: 'general'
    });
    loadMentors();
    setShowNewMessageModal(true);
  };

  const sendNewMessage = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await messageService.sendMessageFromCoordinator(newMessage);
      
      await loadMessages();
      setShowNewMessageModal(false);
      alert('Mesaj başarıyla gönderildi.');
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
      alert('Mesaj gönderilirken bir hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    
    setReplyData({
      receiver_id: selectedMessage.Sender.id,
      subject: `Re: ${selectedMessage.subject || 'Mesaj'}`,
      message: ''
    });
    setShowReplyForm(true);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await messageService.sendMessageFromCoordinator({
        ...replyData,
        parent_message_id: selectedMessage.id
      });
      
      await loadMessages();
      setShowReplyForm(false);
      setReplyData({
        receiver_id: '',
        subject: '',
        message: ''
      });
      alert('Yanıt başarıyla gönderildi.');
    } catch (err) {
      console.error('Yanıt gönderme hatası:', err);
      alert('Yanıt gönderilirken bir hata oluştu.');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await messageService.markMessageAsRead(messageId);
      // Mesajı okundu olarak işaretle
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (err) {
      console.error('Mesaj okundu işaretleme hatası:', err);
    }
  };

  const getMessageTypeIcon = (type) => {
    const icons = {
      'approval': <Badge bg="success">Onay</Badge>,
      'rejection': <Badge bg="danger">Red</Badge>,
      'info': <Badge bg="info">Bilgi</Badge>,
      'warning': <Badge bg="warning">Uyarı</Badge>,
      'general': <Badge bg="secondary">Genel</Badge>
    };
    
    return icons[type] || icons.general;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Mesajlar yükleniyor...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header as="h5" className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <span><FaInbox className="me-2" />Mesajlar</span>
            <div className="d-flex gap-2">
              <Button 
                variant="light" 
                size="sm"
                onClick={handleNewMessage}
              >
                <FaPlus className="me-1" /> Yeni Mesaj
              </Button>
              <Form.Select 
                size="sm" 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="w-auto"
              >
                <option value="all">Tümü</option>
                <option value="unread">Okunmamış</option>
                <option value="received">Gelen</option>
                <option value="sent">Gönderilen</option>
                <option value="company">Şirketlerden</option>
              </Form.Select>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}
          
          <Row className="g-0">
            <Col md={4} className="border-end">
              <div className="p-3">
                <h6><FaFilter className="me-2" />Mesaj Listesi</h6>
              </div>
              
              {filteredMessages.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  Mesaj bulunamadı.
                </div>
              ) : (
                <ListGroup variant="flush">
                  {filteredMessages.map((message) => (
                    <ListGroup.Item 
                      key={message.id}
                      action
                      active={selectedMessage?.id === message.id}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.is_read && message.receiver_id === message.currentUserId) {
                          markAsRead(message.id);
                        }
                      }}
                      className="border-0 border-bottom"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            {message.sender_company ? (
                              <>
                                <FaBuilding className="me-2 text-primary" />
                                <strong className="me-2">{message.sender_company}</strong>
                              </>
                            ) : (
                              <>
                                <FaUser className="me-2 text-muted" />
                                <strong className="me-2">
                                  {message.Sender.first_name} {message.Sender.last_name}
                                </strong>
                              </>
                            )}
                            {getMessageTypeIcon(message.message_type)}
                          </div>
                          <div className="text-muted small">
                            {message.subject || 'Konu yok'}
                          </div>
                          <div className="text-muted small mt-1">
                            <FaClock className="me-1" />
                            {formatDate(message.created_at)}
                          </div>
                        </div>
                        {!message.is_read && message.receiver_id === message.currentUserId && (
                          <Badge bg="primary" pill>Yeni</Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Col>
            
            <Col md={8}>
              {selectedMessage ? (
                <div className="p-4">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5>{selectedMessage.subject || 'Konu yok'}</h5>
                        <div className="text-muted">
                          <strong>Gönderen:</strong> {
                            selectedMessage.sender_company ? (
                              <>
                                <FaBuilding className="ms-1 me-1" />
                                {selectedMessage.sender_company} - {selectedMessage.Sender.first_name} {selectedMessage.Sender.last_name}
                              </>
                            ) : (
                              `${selectedMessage.Sender.first_name} ${selectedMessage.Sender.last_name}`
                            )
                          }
                          <br />
                          <strong>Tarih:</strong> {formatDate(selectedMessage.created_at)}
                          {selectedMessage.is_read && (
                            <>
                              <br />
                              <FaCheckDouble className="text-success me-1" />
                              <small>Okundu</small>
                            </>
                          )}
                        </div>
                      </div>
                      {getMessageTypeIcon(selectedMessage.message_type)}
                    </div>
                    
                    <Card className="bg-light">
                      <Card.Body>
                        <p className="mb-0 white-space-pre-wrap">{selectedMessage.message}</p>
                      </Card.Body>
                    </Card>
                  </div>
                  
                  {!showReplyForm ? (
                    <Button variant="primary" onClick={handleReply}>
                      <FaReply className="me-2" />
                      Yanıtla
                    </Button>
                  ) : (
                    <Card>
                      <Card.Body>
                        <h6>Yanıt Yaz</h6>
                        <Form onSubmit={sendReply}>
                          <Form.Group className="mb-3">
                            <Form.Label>Konu</Form.Label>
                            <Form.Control
                              type="text"
                              value={replyData.subject}
                              onChange={(e) => setReplyData({...replyData, subject: e.target.value})}
                              readOnly
                            />
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Mesaj</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              value={replyData.message}
                              onChange={(e) => setReplyData({...replyData, message: e.target.value})}
                              required
                              placeholder="Mesajınızı yazın..."
                            />
                          </Form.Group>
                          
                          <div className="d-flex gap-2">
                            <Button variant="primary" type="submit" disabled={sending}>
                              {sending ? (
                                <>
                                  <Spinner size="sm" className="me-2" />
                                  Gönderiliyor...
                                </>
                              ) : (
                                <>
                                  <FaPaperPlane className="me-2" />
                                  Gönder
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="secondary" 
                              onClick={() => setShowReplyForm(false)}
                              disabled={sending}
                            >
                              İptal
                            </Button>
                          </div>
                        </Form>
                      </Card.Body>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="p-5 text-center text-muted">
                  <FaEnvelope size={48} className="mb-3" />
                  <p>Görüntülemek için bir mesaj seçin</p>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Yeni Mesaj Modalı */}
      <Modal show={showNewMessageModal} onHide={() => setShowNewMessageModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Yeni Mesaj</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingMentors ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Mentor listesi yükleniyor...</p>
            </div>
          ) : (
            <Form onSubmit={sendNewMessage}>
              <Form.Group className="mb-3">
                <Form.Label>Alıcı</Form.Label>
                <Form.Select
                  value={newMessage.receiver_id}
                  onChange={(e) => setNewMessage({...newMessage, receiver_id: e.target.value})}
                  required
                >
                  <option value="">Seçiniz...</option>
                  {mentors.map(mentor => (
                    <option key={mentor.id} value={mentor.id}>
                      <FaBuilding className="me-1" />
                      {mentor.company} - {mentor.name} ({mentor.email})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Şirket mentorları ve yetkilileri listede görüntülenmektedir.
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Konu</Form.Label>
                <Form.Control
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                  required
                  placeholder="Mesaj konusu..."
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Mesaj Tipi</Form.Label>
                <Form.Select
                  value={newMessage.message_type}
                  onChange={(e) => setNewMessage({...newMessage, message_type: e.target.value})}
                >
                  <option value="general">Genel</option>
                  <option value="info">Bilgilendirme</option>
                  <option value="warning">Uyarı</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Mesaj</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  required
                  placeholder="Mesajınızı yazın..."
                />
              </Form.Group>
              
              <div className="d-flex gap-2 justify-content-end">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowNewMessageModal(false)}
                  disabled={sending}
                >
                  İptal
                </Button>
                <Button variant="primary" type="submit" disabled={sending}>
                  {sending ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" />
                      Gönder
                    </>
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default CoordinatorMessages;