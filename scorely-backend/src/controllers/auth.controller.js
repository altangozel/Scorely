const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { User, Role } = require('../models');
require('dotenv').config();

// Kullanıcı kaydı
exports.register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role_name, tckn, phone_number } = req.body;

    // E-posta kontrolü
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
    }

    // Rol ID'sini bul
    if (role_name && role_name !== 'student') return res.status(403).json({ message: 'Yetkili roller açık kayıt ile oluşturulamaz.' });
    const role = await Role.findOne({ where: { name: 'student' } });
    if (!role) {
      return res.status(400).json({ message: 'Geçersiz rol.' });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Benzersiz ID'ler oluştur
    const application_id = uuidv4();
    const form_id = uuidv4();

    // Yeni kullanıcı oluştur
    const newUser = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      tckn,
      phone_number,
      role_id: role.id,
      application_id,
      form_id,
      is_verified: false,
      approved_program_code: null // Yeni alan
    });

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu.',
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: role.name,
        application_id: newUser.application_id
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Role, attributes: ['name'] }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Şifre kontrolü
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Geçersiz şifre.' });
    }

    // JWT oluştur
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.Role.name  
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Başarıyla giriş yapıldı.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.Role.name,
        approved_program_code: user.approved_program_code // Yeni alan
      },
      token
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Kullanıcı bilgilerini al
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [{ model: Role, attributes: ['name'] }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Kullanıcı bilgilerini döndür
    const userProfile = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      tckn: user.tckn,
      phone_number: user.phone_number,
      is_verified: user.is_verified,
      role: user.Role.name,
      application_id: user.application_id,
      form_id: user.form_id,
      gpa: user.gpa,
      approved_program_code: user.approved_program_code,
      created_at: user.created_at
    };

    // Eğer approved_program_code null ise, onaylanmış başvuru var mı kontrol et
    if (!user.approved_program_code && user.Role.name === 'student') {
      const InternshipApplication = require('../models').InternshipApplication;
      
      const approvedApplication = await InternshipApplication.findOne({
        where: { 
          user_id: userId, 
          coordinator_status: 'approved' 
        },
        attributes: ['program_code']
      });

      if (approvedApplication) {
        // Kullanıcıyı güncelle
        await user.update({ 
          approved_program_code: approvedApplication.program_code 
        });
        
        userProfile.approved_program_code = approvedApplication.program_code;
      }
    }

    res.status(200).json({
      user: userProfile
    });
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};