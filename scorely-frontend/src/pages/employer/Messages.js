import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { 
  FaEnvelope, FaReply, FaUser, FaClock, FaCheckDouble, 
  FaPaperPlane, FaInbox, FaFilter 
} from 'react-icons/fa';
import { employerService } from '../../services/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, sent, received
  const [sending, setSending] = useState(false);
  
  // Reply form
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyData, setReplyData] = useState({
    receiver_id: '',
    placement_id: '',
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
      const response = await employerService.getMessages();
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Mesaj yükleme hatası:', err);
      setError('Mesajlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
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
      default:
        break;
    }
    
    setFilteredMessages(filtered);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    
    setReplyData({
      receiver_id: selectedMessage.Sender.id,
      placement_id: selectedMessage.placement_id,
      subject: `Re: ${selectedMessage.subject || 'Mesaj'}`,
      message: ''
    });
    setShowReplyForm(true);
  };

  const sendReply = async (e) => {
    e.preventDefault();
    setSending(true);
    
    try {
      await employerService.sendMessage({
        ...replyData,
        parent_message_id: selectedMessage.id
      });
      
      await loadMessages();
      setShowReplyForm(false);
      setReplyData({
        receiver_id: '',
        placement_id: '',
        subject: '',
        message: ''
      });
      alert('Mesaj başarıyla gönderildi.');
    } catch (err) {
      console.error('Mesaj gönderme hatası:', err);
      alert('Mesaj gönderilirken bir hata oluştu.');
    } finally {
      setSending(false);
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
            </Form.Select>
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
                      onClick={() => setSelectedMessage(message)}
                      className="border-0 border-bottom"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <FaUser className="me-2 text-muted" />
                            <strong className="me-2">
                              {message.Sender.first_name} {message.Sender.last_name}
                            </strong>
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
                          <strong>Gönderen:</strong> {selectedMessage.Sender.first_name} {selectedMessage.Sender.last_name}
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
    </Container>
  );
};

export default Messages;