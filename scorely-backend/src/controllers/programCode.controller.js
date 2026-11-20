// controllers/programCode.controller.js
const { ProgramCode, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Tüm program kodlarını getir
exports.getAllProgramCodes = async (req, res) => {
  try {
    const coordinatorId = req.user.id;
    
    const programCodes = await ProgramCode.findAll({
      where: { coordinator_id: coordinatorId },
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({ program_codes: programCodes });
  } catch (error) {
    console.error('Program kodları getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Yeni program kodu oluştur
exports.createProgramCode = async (req, res) => {
  try {
    const { name, description } = req.body;
    const coordinatorId = req.user.id;
    
    // Benzersiz kod oluştur
    const code = uuidv4().substring(0, 8).toUpperCase();
    
    const programCode = await ProgramCode.create({
      code,
      name,
      description,
      coordinator_id: coordinatorId,
      is_active: true
    });
    
    res.status(201).json({ 
      message: 'Program kodu başarıyla oluşturuldu', 
      program_code: programCode 
    });
  } catch (error) {
    console.error('Program kodu oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Program kodunu aktif/pasif yap
exports.toggleProgramCode = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinatorId = req.user.id;
    
    const programCode = await ProgramCode.findOne({
      where: { id, coordinator_id: coordinatorId }
    });
    
    if (!programCode) {
      return res.status(404).json({ message: 'Program kodu bulunamadı.' });
    }
    
    await programCode.update({
      is_active: !programCode.is_active,
      updated_at: new Date()
    });
    
    res.status(200).json({ 
      message: `Program kodu ${programCode.is_active ? 'aktif' : 'pasif'} duruma getirildi.`, 
      program_code: programCode 
    });
  } catch (error) {
    console.error('Program kodu güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Program kodunu doğrula
exports.validateProgramCode = async (req, res) => {
  try {
    const { code } = req.body;
    
    const programCode = await ProgramCode.findOne({
      where: { code, is_active: true },
      include: [{ 
        model: User, 
        attributes: ['id', 'first_name', 'last_name', 'email'],
        as: 'Coordinator'
      }]
    });
    
    if (!programCode) {
      return res.status(404).json({ 
        valid: false,
        message: 'Geçersiz program kodu.' 
      });
    }
    
    // Burada Coordinator kullanılıyor çünkü ilişkiyi as: 'Coordinator' olarak tanımladık
    res.status(200).json({ 
      valid: true,
      message: 'Program kodu geçerli.',
      program: {
        name: programCode.name,
        description: programCode.description,
        coordinator: `${programCode.Coordinator.first_name} ${programCode.Coordinator.last_name}`
      }
    });
  } catch (error) {
    console.error('Program kodu doğrulama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};