// controllers/internship.controller.js
const { InternshipApplication, CV, User, ProgramCode } = require('../models');
const { Op } = require('sequelize');

// Staj başvurusu yap
exports.applyForInternship = async (req, res) => {
  try {
    const { program_code, cv_id } = req.body;
    const userId = req.user.id;
    
    // Önceden başvuru var mı kontrol et
    const existingApplication = await InternshipApplication.findOne({
      where: { 
        user_id: userId, 
        program_code: program_code 
      }
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'Bu programa zaten başvurdunuz.' });
    }
    
    // CV'nin kullanıcıya ait olduğunu kontrol et
    const cv = await CV.findOne({
      where: { 
        id: cv_id, 
        user_id: userId 
      }
    });
    
    if (!cv) {
      return res.status(404).json({ message: 'CV bulunamadı.' });
    }
    
    // Program kodunun aktif olduğunu kontrol et
    const program = await ProgramCode.findOne({
      where: { 
        code: program_code, 
        is_active: true 
      }
    });
    
    if (!program) {
      return res.status(404).json({ message: 'Program bulunamadı veya aktif değil.' });
    }
    
    // Başvuru oluştur
    const application = await InternshipApplication.create({
      user_id: userId,
      program_code: program_code,
      cv_id: cv_id,
      coordinator_status: 'pending',
      company_status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    res.status(201).json({
      message: 'Başvuru başarıyla oluşturuldu.',
      application
    });
  } catch (error) {
    console.error('Başvuru oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Program başvurularını getir (koordinatör için)
exports.getProgramApplications = async (req, res) => {
  try {
    const { program_code, status, sort_by = 'created_at', sort_order = 'desc' } = req.query;
    const coordinatorId = req.user.id;
    
    // Koordinatörün yetkili olduğu programları kontrol et
    const program = await ProgramCode.findOne({
      where: { 
        code: program_code, 
        coordinator_id: coordinatorId 
      }
    });
    
    if (!program) {
      return res.status(403).json({ message: 'Bu program için yetkiniz yok.' });
    }
    
    // Filtre koşulları
    const whereClause = { program_code };
    
    if (status) {
      whereClause.coordinator_status = status;
    }
    
    // Sıralama
    const orderClause = [[sort_by, sort_order.toUpperCase()]];
    
    const applications = await InternshipApplication.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number', 'approved_program_code', 'gpa']
        },
        {
          model: CV,
          attributes: ['id', 'original_filename', 'file_type', 'total_score', 'education_level', 'estimated_experience_years']
        }
      ],
      order: orderClause
    });
    
    res.status(200).json({ applications });
  } catch (error) {
    console.error('Başvuru getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Başvuru durumunu güncelle (koordinatör için) - DÜZELTİLMİŞ
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinator_status, coordinator_notes } = req.body;
    const coordinatorId = req.user.id;
    
    console.log('Güncelleme başlatıldı - Başvuru ID:', id, 'Yeni durum:', coordinator_status);
    
    // Başvuruyu bul
    const application = await InternshipApplication.findByPk(id, {
      include: [{ model: User }]
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı.' });
    }
    
    console.log('Başvuru bulundu - User ID:', application.user_id, 'Program Code:', application.program_code);
    
    // Koordinatörün yetkisini kontrol et
    const program = await ProgramCode.findOne({
      where: { 
        code: application.program_code, 
        coordinator_id: coordinatorId 
      }
    });
    
    if (!program) {
      return res.status(403).json({ message: 'Bu başvuruyu güncelleme yetkiniz yok.' });
    }
    
    // Başvuruyu güncelle
    const updateData = {
      coordinator_status,
      coordinator_notes: coordinator_notes || application.coordinator_notes,
      updated_at: new Date()
    };
    
    // Durum değişikliği varsa reviewed_at'i güncelle
    if (application.coordinator_status !== coordinator_status) {
      updateData.coordinator_reviewed_at = new Date();
    }
    
    await application.update(updateData);
    console.log('Başvuru güncellendi');
    
    // Eğer koordinatör onayı verildiyse, öğrencinin approved_program_code'unu güncelle
    if (coordinator_status === 'approved') {
      console.log('Onay verildi, kullanıcı güncelleniyor...');
      
      const [updateCount] = await User.update(
        { 
          approved_program_code: application.program_code,
          updated_at: new Date()
        },
        { 
          where: { id: application.user_id },
          returning: true
        }
      );
      
      console.log('User güncelleme sonucu - Güncellenen kayıt sayısı:', updateCount);
      
      // Güncellenen kullanıcıyı kontrol et
      const updatedUser = await User.findByPk(application.user_id, {
        attributes: ['id', 'email', 'approved_program_code']
      });
      
      console.log('Güncellenmiş kullanıcı:', updatedUser ? updatedUser.toJSON() : 'Bulunamadı');
    } else if (coordinator_status === 'rejected') {
      // Eğer reddedildiyse approved_program_code'u temizle
      console.log('Başvuru reddedildi, kullanıcı güncelleniyor...');
      
      await User.update(
        { 
          approved_program_code: null,
          updated_at: new Date()
        },
        { where: { id: application.user_id } }
      );
    }
    
    // Güncel başvuru bilgisini döndür
    const updatedApplication = await InternshipApplication.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'first_name', 'last_name', 'email', 'approved_program_code']
        }
      ]
    });
    
    res.status(200).json({
      message: 'Başvuru durumu güncellendi.',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Başvuru güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Onayı geri al (koordinatör için)
exports.revokeApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinatorId = req.user.id;
    
    // Başvuruyu bul
    const application = await InternshipApplication.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı.' });
    }
    
    // Koordinatörün yetkisini kontrol et
    const program = await ProgramCode.findOne({
      where: { 
        code: application.program_code, 
        coordinator_id: coordinatorId 
      }
    });
    
    if (!program) {
      return res.status(403).json({ message: 'Bu başvuruyu güncelleme yetkiniz yok.' });
    }
    
    // Sadece onaylanmış başvuruların onayı geri alınabilir
    if (application.coordinator_status !== 'approved') {
      return res.status(400).json({ message: 'Sadece onaylanmış başvuruların onayı geri alınabilir.' });
    }
    
    // Onayı geri al
    await application.update({
      coordinator_status: 'pending',
      coordinator_reviewed_at: null,
      updated_at: new Date()
    });
    
    // Öğrencinin approved_program_code'unu temizle
    await User.update(
      { 
        approved_program_code: null,
        updated_at: new Date()
      },
      { where: { id: application.user_id } }
    );
    
    res.status(200).json({
      message: 'Başvuru onayı geri alındı.',
      application
    });
  } catch (error) {
    console.error('Onay geri alma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğrencinin başvurularını getir
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const applications = await InternshipApplication.findAll({
      where: { user_id: userId },
      include: [
        { 
          model: CV,
          attributes: ['id', 'original_filename', 'file_type', 'total_score']
        },
        {
          model: ProgramCode,
          attributes: ['id', 'name', 'description', 'code']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    // Her başvuru için durum bilgisi ekle
    const applicationsWithStatus = applications.map(app => {
      const appData = app.toJSON();
      
      // Sadece koordinatör durumuna göre durum belirleme
      if (appData.coordinator_status === 'pending') {
        appData.overall_status = 'pending';
        appData.overall_status_text = 'Koordinatör onayı bekliyor';
      } else if (appData.coordinator_status === 'rejected') {
        appData.overall_status = 'rejected';
        appData.overall_status_text = 'Koordinatör tarafından reddedildi';
      } else if (appData.coordinator_status === 'approved') {
        appData.overall_status = 'approved';
        appData.overall_status_text = 'Staj başvurusu onaylandı';
      }
      
      return appData;
    });
    
    res.status(200).json({ applications: applicationsWithStatus });
  } catch (error) {
    console.error('Başvuru getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğrenci başvurusunu geri çek
exports.withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Başvuruyu bul
    const application = await InternshipApplication.findOne({
      where: { 
        id: id,
        user_id: userId 
      }
    });
    
    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı.' });
    }
    
    // Sadece beklemede olan başvurular geri çekilebilir
    if (application.coordinator_status !== 'pending') {
      return res.status(400).json({ 
        message: 'Sadece henüz değerlendirilmemiş başvurular geri çekilebilir.' 
      });
    }
    
    // Başvuruyu sil
    await application.destroy();
    
    res.status(200).json({
      message: 'Başvuru başarıyla geri çekildi.'
    });
  } catch (error) {
    console.error('Başvuru geri çekme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};