// controllers/company.controller.js
const { 
    InternshipCompany, 
    ProgramCode, 
    User, 
    InternshipApplication, 
    InternshipPlacement,
    CompanyProfile,
    Mentor,
    Department
  } = require('../models');

// Tüm şirketleri getir
exports.getAllCompanies = async (req, res) => {
  try {
    const coordinatorId = req.user.id;
    const { program_code } = req.query;
    
    const whereCondition = { coordinator_id: coordinatorId };
    if (program_code) {
      whereCondition.program_code = program_code;
    }
    
    const companies = await InternshipCompany.findAll({
      where: whereCondition,
      include: [
        { model: ProgramCode, attributes: ['name'], targetKey: 'code' }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.status(200).json({ companies });
  } catch (error) {
    console.error('Şirket listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Staj şirketi ekleme - GÜNCELLEME: Mentor bilgilerini kontrol et
exports.addCompany = async (req, res) => {
  try {
    const coordinatorId = req.user.id;
    const { 
      name, location, available_positions, description, 
      requirements, program_code, logo_url, application_deadline 
    } = req.body;
    
    // Program kodu kontrolü
    const programCode = await ProgramCode.findOne({
      where: { code: program_code, coordinator_id: coordinatorId }
    });
    
    if (!programCode) {
      return res.status(400).json({ message: 'Geçersiz program kodu veya yetkiniz yok.' });
    }
    
    // Tarih doğrulama
    let validDeadline = null;
    if (application_deadline && application_deadline !== 'Invalid date') {
      validDeadline = new Date(application_deadline);
      // Tarihin geçerli olup olmadığını kontrol et
      if (isNaN(validDeadline.getTime())) {
        return res.status(400).json({ message: 'Geçersiz başvuru son tarihi formatı' });
      }
    }
    
    // Şirket profili ve mentor bilgilerini kontrol et
    let companyWithMentors = null;
    if (name) {
      // Şirket adına göre profil bul
      const companyProfile = await CompanyProfile.findOne({
        where: { company_name: name },
        include: [
          {
            model: Mentor,
            where: { is_active: true },
            required: false,
            include: [{ model: Department }]
          },
          {
            model: Department,
            where: { is_active: true },
            required: false
          }
        ]
      });
      
      if (companyProfile && companyProfile.Mentors && companyProfile.Mentors.length > 0) {
        companyWithMentors = {
          profile: companyProfile,
          mentors: companyProfile.Mentors,
          departments: companyProfile.Departments
        };
      }
    }
    
    const newCompany = await InternshipCompany.create({
      name,
      location,
      available_positions: available_positions || 1,
      description,
      requirements,
      program_code,
      logo_url,
      application_deadline: validDeadline,
      coordinator_id: coordinatorId,
      is_active: true
    });
    
    // Eğer mentor bilgileri varsa, response'a ekle
    const responseData = {
      message: 'Staj şirketi başarıyla eklendi.',
      company: newCompany
    };
    
    if (companyWithMentors) {
      responseData.mentorInfo = companyWithMentors;
    }
    
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Şirket ekleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Staj şirketi güncelleme
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinatorId = req.user.id;
    const { 
      name, location, available_positions, description, 
      requirements, logo_url, application_deadline, is_active 
    } = req.body;
    
    // Şirket kontrolü
    const company = await InternshipCompany.findOne({
      where: { id, coordinator_id: coordinatorId }
    });
    
    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı veya yetkiniz yok.' });
    }
    
    // Tarih doğrulama
    let validDeadline = company.application_deadline;
    if (application_deadline) {
      if (application_deadline === 'Invalid date') {
        validDeadline = null;
      } else {
        validDeadline = new Date(application_deadline);
        // Tarihin geçerli olup olmadığını kontrol et
        if (isNaN(validDeadline.getTime())) {
          return res.status(400).json({ message: 'Geçersiz başvuru son tarihi formatı' });
        }
      }
    }
    
    await company.update({
      name: name || company.name,
      location: location !== undefined ? location : company.location,
      available_positions: available_positions || company.available_positions,
      description: description !== undefined ? description : company.description,
      requirements: requirements !== undefined ? requirements : company.requirements,
      logo_url: logo_url !== undefined ? logo_url : company.logo_url,
      application_deadline: validDeadline,
      is_active: is_active !== undefined ? is_active : company.is_active,
      updated_at: new Date()
    });
    
    res.status(200).json({
      message: 'Staj şirketi başarıyla güncellendi.',
      company
    });
  } catch (error) {
    console.error('Şirket güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Staj şirketi silme
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinatorId = req.user.id;
    
    // Şirket kontrolü
    const company = await InternshipCompany.findOne({
      where: { id, coordinator_id: coordinatorId }
    });
    
    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı veya yetkiniz yok.' });
    }
    
    await company.destroy();
    
    res.status(200).json({ message: 'Staj şirketi başarıyla silindi.' });
  } catch (error) {
    console.error('Şirket silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Koordinatöre şirket mentor bilgilerini sağlayan yeni endpoint
exports.getCompanyMentorInfo = async (req, res) => {
  try {
    const { company_name } = req.query;
    
    if (!company_name) {
      return res.status(400).json({ message: 'Şirket adı gereklidir.' });
    }
    
    // Şirket profilini mentor ve departman bilgileriyle birlikte getir
    const companyProfile = await CompanyProfile.findOne({
      where: { company_name },
      include: [
        {
          model: Mentor,
          where: { is_active: true },
          required: false,
          include: [{ model: Department }]
        },
        {
          model: Department,
          where: { is_active: true },
          required: false
        },
        {
          model: User,
          attributes: ['id', 'email', 'first_name', 'last_name']
        }
      ]
    });
    
    if (!companyProfile) {
      return res.status(404).json({ 
        message: 'Bu şirket için profil bulunamadı veya mentor bilgisi yok.' 
      });
    }
    
    // Mentor bilgisi yoksa uyarı döndür
    if (!companyProfile.Mentors || companyProfile.Mentors.length === 0) {
      return res.status(200).json({
        hasProfile: true,
        hasMentors: false,
        message: 'Şirket profili var ancak mentor eklenmemiş.',
        company: {
          name: companyProfile.company_name,
          sector: companyProfile.sector,
          employee_count: companyProfile.employee_count
        }
      });
    }
    
    res.status(200).json({
      hasProfile: true,
      hasMentors: true,
      company: {
        name: companyProfile.company_name,
        sector: companyProfile.sector,
        employee_count: companyProfile.employee_count,
        description: companyProfile.description,
        address: companyProfile.address,
        phone: companyProfile.phone,
        website: companyProfile.website
      },
      mentors: companyProfile.Mentors.map(mentor => ({
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone,
        title: mentor.title,
        department: mentor.Department ? mentor.Department.name : null
      })),
      departments: companyProfile.Departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description
      })),
      contactPerson: {
        id: companyProfile.User.id,
        name: `${companyProfile.User.first_name} ${companyProfile.User.last_name}`,
        email: companyProfile.User.email
      }
    });
  } catch (error) {
    console.error('Şirket mentor bilgisi getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Koordinatör onayı almış öğrencilere gösterilecek şirketleri getir - DÜZELTİLMİŞ
// Koordinatör onayı almış öğrencilere gösterilecek şirketleri getir - DÜZELTİLMİŞ
exports.getCompaniesForStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    let { program_code } = req.query;
    
    console.log('Şirket listesi isteniyor - User ID:', userId, 'Program Code:', program_code);
    console.log('Kullanıcının approved_program_code:', user.approved_program_code);
    
    // Eğer program_code verilmediyse, kullanıcının approved_program_code'unu kullan
    if (!program_code && user.approved_program_code) {
      program_code = user.approved_program_code;
      console.log('Query\'den program kodu gelmedi, kullanıcının approved_program_code kullanılıyor:', program_code);
    }
    
    if (!program_code) {
      return res.status(400).json({ 
        message: 'Program kodu gereklidir veya onaylanmış bir program kodunuz bulunmuyor.',
        debug: {
          approved_program_code: user.approved_program_code,
          query_program_code: req.query.program_code
        }
      });
    }
    
    // Öğrencinin bu programa koordinatör tarafından onaylanmış başvurusu var mı kontrol et
    const application = await InternshipApplication.findOne({
      where: { 
        user_id: userId, 
        program_code,
        coordinator_status: 'approved'
      }
    });
    
    console.log('Başvuru durumu:', application ? 'Bulundu' : 'Bulunamadı');
    
    if (!application) {
      // Eğer başvuru bulunamadıysa, kullanıcının approved_program_code'u var mı kontrol et
      if (user.approved_program_code === program_code) {
        console.log('Kullanıcının approved_program_code ile eşleşiyor, devam ediliyor');
      } else {
        return res.status(403).json({ 
          message: 'Bu program için koordinatör tarafından onaylanmış başvurunuz bulunmuyor.',
          debug: {
            user_approved_code: user.approved_program_code,
            requested_code: program_code,
            application_found: false
          }
        });
      }
    }
    
    // Program için aktif şirketleri getir
    const companies = await InternshipCompany.findAll({
      where: { 
        program_code,
        is_active: true
      },
      attributes: ['id', 'name', 'description', 'location', 'available_positions', 'requirements'],
      order: [['name', 'ASC']]
    });
    
    console.log('Bulunan şirket sayısı:', companies.length);
    
    // Mevcut tercihleri kontrol et
    let placements = [];
    if (application) {
      placements = await InternshipPlacement.findAll({
        where: { application_id: application.id },
        attributes: ['company_id', 'preference_order']
      });
    }
    
    res.status(200).json({ 
      companies,
      existingPreferences: placements,
      approved_program_code: program_code,
      total: companies.length 
    });
  } catch (error) {
    console.error('Şirket listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};