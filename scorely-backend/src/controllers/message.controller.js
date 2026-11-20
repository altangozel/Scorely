// controllers/message.controller.js
const { InternshipMessage, User, Mentor, CompanyProfile, sequelize } = require('../models');
const { Op } = require('sequelize');

// Koordinatör için mentor listesi getir
exports.getAvailableMentorsForCoordinator = async (req, res) => {
  try {
    const coordinatorId = req.user.id;
    
    // Tüm aktif mentorları getir
    const mentors = await Mentor.findAll({
      where: { is_active: true },
      include: [
        {
          model: CompanyProfile,
          attributes: ['company_name', 'user_id'],
          include: [{
            model: User,
            attributes: ['id', 'email', 'first_name', 'last_name']
          }]
        }
      ]
    });
    
    // Mentor bilgilerini düzenle
    const mentorList = mentors.map(mentor => ({
      id: mentor.CompanyProfile.User.id, // User ID'sini kullan
      mentor_id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      company: mentor.CompanyProfile.company_name,
      user_name: `${mentor.CompanyProfile.User.first_name} ${mentor.CompanyProfile.User.last_name}`
    }));
    
    res.status(200).json({ mentors: mentorList });
  } catch (error) {
    console.error('Mentor listesi getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Koordinatör için mesaj gönder
exports.sendMessageFromCoordinator = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id, subject, message, message_type = 'general' } = req.body;
    
    // Placement ID'yi null olarak ayarla (staj yerleştirmesi ile ilgili değil)
    const newMessage = await InternshipMessage.create({
      sender_id: senderId,
      receiver_id,
      placement_id: 0, // Varsayılan değer
      subject,
      message,
      message_type
    });
    
    res.status(201).json({
      message: 'Mesaj başarıyla gönderildi.',
      sentMessage: newMessage
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Koordinatör için mesajları getir
exports.getMessagesForCoordinator = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message_type, unread_only } = req.query;
    
    const whereClause = {
      [Op.or]: [
        { sender_id: userId },
        { receiver_id: userId }
      ]
    };
    
    if (message_type) {
      whereClause.message_type = message_type;
    }
    
    if (unread_only === 'true') {
      whereClause.is_read = false;
      whereClause.receiver_id = userId;
    }
    
    const messages = await InternshipMessage.findAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'Sender', 
          attributes: ['id', 'first_name', 'last_name', 'email', 'role_id'],
          include: [{ 
            model: CompanyProfile,
            attributes: ['company_name']
          }]
        },
        { 
          model: User, 
          as: 'Receiver', 
          attributes: ['id', 'first_name', 'last_name', 'email', 'role_id'] 
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Okunmamış mesajları okundu olarak işaretle
    if (!unread_only || unread_only !== 'true') {
      await InternshipMessage.update(
        { is_read: true, read_date: new Date() },
        {
          where: {
            receiver_id: userId,
            is_read: false,
            id: { [Op.in]: messages.map(m => m.id) }
          }
        }
      );
    }
    
    // Mesajları formatla
    const formattedMessages = messages.map(msg => ({
      ...msg.toJSON(),
      currentUserId: userId,
      sender_company: msg.Sender.CompanyProfile ? msg.Sender.CompanyProfile.company_name : null
    }));
    
    res.status(200).json({ messages: formattedMessages });
  } catch (error) {
    console.error('Mesaj getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Mesajı okundu olarak işaretle
exports.markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const message = await InternshipMessage.findOne({
      where: { id, receiver_id: userId }
    });
    
    if (!message) {
      return res.status(404).json({ message: 'Mesaj bulunamadı veya yetkiniz yok.' });
    }
    
    await message.update({
      is_read: true,
      read_date: new Date()
    });
    
    res.status(200).json({ message: 'Mesaj okundu olarak işaretlendi.' });
  } catch (error) {
    console.error('Mesaj güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};