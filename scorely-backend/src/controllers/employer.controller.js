const { 
  CompanyProfile, 
  Department, 
  Mentor, 
  MentorAssignment,
  InternshipPlacement,
  InternshipApplication,
  InternshipCompany,
  User,
  CV,
  StudentTranscript,
  InternshipMessage,
  ProgramCode,  // Bu satır eklendi
  sequelize
} = require('../models');
const { Op } = require('sequelize');

// Şirket profili oluştur/güncelle
exports.updateCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      company_name,
      tax_number,
      address,
      phone,
      website,
      sector,
      employee_count,
      description,
      logo_url
    } = req.body;

    // Mevcut profili kontrol et
    let profile = await CompanyProfile.findOne({ where: { user_id: userId } });

    if (profile) {
      // Güncelle
      await profile.update({
        company_name,
        tax_number,
        address,
        phone,
        website,
        sector,
        employee_count,
        description,
        logo_url,
        updated_at: new Date()
      });
    } else {
      // Yeni oluştur
      profile = await CompanyProfile.create({
        user_id: userId,
        company_name,
        tax_number,
        address,
        phone,
        website,
        sector,
        employee_count,
        description,
        logo_url
      });
    }

    res.status(200).json({
      message: 'Şirket profili başarıyla güncellendi.',
      profile
    });
  } catch (error) {
    console.error('Şirket profili güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Şirket profilini getir
exports.getCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await CompanyProfile.findOne({
      where: { user_id: userId },
      include: [
        { model: Department, where: { is_active: true }, required: false },
        { model: Mentor, where: { is_active: true }, required: false }
      ]
    });

    if (!profile) {
      return res.status(404).json({ message: 'Şirket profili bulunamadı.' });
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error('Şirket profili getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Şirkete atanan öğrencileri listele
// getAssignedStudents fonksiyonuna transkript ve CV bilgilerini ekleyelim
exports.getAssignedStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, department_id } = req.query;

    // Şirket profilini bul
    const companyProfile = await CompanyProfile.findOne({ where: { user_id: userId } });
    
    if (!companyProfile) {
      return res.status(404).json({ message: 'Şirket profili bulunamadı.' });
    }

    // Şirketin staj firmalarını bul
    const companyIds = await InternshipCompany.findAll({
      attributes: ['id'],
      where: { name: companyProfile.company_name }
    }).then(companies => companies.map(c => c.id));

    if (companyIds.length === 0) {
      return res.status(200).json({ students: [] });
    }

    // Yerleştirmeleri bul
    const whereClause = {
      company_id: { [Op.in]: companyIds },
      placement_status: { [Op.in]: ['placed', 'placed_alternative'] }
    };

    if (status) {
      whereClause.company_approval_status = status;
    }

    const placements = await InternshipPlacement.findAll({
      where: whereClause,
      include: [
        {
          model: InternshipApplication,
          include: [
            {
              model: User,
              attributes: ['id', 'first_name', 'last_name', 'email', 'phone_number', 'gpa'],
              include: [
                { 
                  model: CV, 
                  attributes: ['id', 'original_filename', 'total_score', 'extracted_skills', 'education_level', 'estimated_experience_years'] 
                },
                {
                  model: StudentTranscript,
                  as: 'Transcripts',
                  where: { is_active: true },
                  required: false,
                  attributes: ['id', 'original_filename', 'gpa', 'verified_by_coordinator']
                }
              ]
            },
            {
              model: ProgramCode,
              attributes: ['name', 'code']
            }
          ]
        },
        {
          model: MentorAssignment,
          where: { is_active: true },
          required: false,
          include: [
            { 
              model: Mentor,
              include: [{ model: Department }]
            }
          ]
        },
        {
          model: InternshipCompany,
          attributes: ['name', 'location']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const students = placements.map(placement => ({
      placement_id: placement.id,
      student: {
        id: placement.InternshipApplication.User.id,
        name: `${placement.InternshipApplication.User.first_name} ${placement.InternshipApplication.User.last_name}`,
        email: placement.InternshipApplication.User.email,
        phone: placement.InternshipApplication.User.phone_number,
        gpa: placement.InternshipApplication.User.gpa,
        cv: placement.InternshipApplication.User.CVs?.[0],
        transcript: placement.InternshipApplication.User.Transcripts?.[0]
      },
      program: placement.InternshipApplication.ProgramCode,
      placement_status: placement.placement_status,
      company_approval_status: placement.company_approval_status,
      company_approval_date: placement.company_approval_date,
      mentor: placement.MentorAssignments?.[0]?.Mentor,
      department: placement.MentorAssignments?.[0]?.Mentor?.Department
    }));

    res.status(200).json({ students });
  } catch (error) {
    console.error('Öğrenci listesi getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğrenci onay durumunu güncelle
exports.updateStudentApproval = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { placement_id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    // Şirket profilini kontrol et
    const companyProfile = await CompanyProfile.findOne({ where: { user_id: userId } });
    
    if (!companyProfile) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Şirket profili bulunamadı.' });
    }

    // Yerleştirmeyi bul ve şirkete ait olduğunu kontrol et
    const placement = await InternshipPlacement.findByPk(placement_id, {
      include: [
        { model: InternshipCompany },
        { model: InternshipApplication }
      ]
    });

    if (!placement || placement.InternshipCompany.name !== companyProfile.company_name) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Bu yerleştirme için yetkiniz yok.' });
    }

    // Onay durumunu güncelle
    await placement.update({
      company_approval_status: status,
      company_approval_date: new Date(),
      company_approval_notes: notes
    }, { transaction });

    // Öğrenciye mesaj gönder
    await InternshipMessage.create({
      sender_id: userId,
      receiver_id: placement.InternshipApplication.user_id,
      placement_id: placement.id,
      message_type: status === 'approved' ? 'approval' : 'rejection',
      subject: `Staj Başvuru ${status === 'approved' ? 'Onayı' : 'Reddi'}`,
      message: notes || `Staj başvurunuz ${status === 'approved' ? 'onaylanmıştır' : 'reddedilmiştir'}.`
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      message: 'Öğrenci onay durumu güncellendi.',
      placement
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Onay güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Departman yönetimi
exports.manageDepartments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body; // 'create', 'update', 'delete'

    const companyProfile = await CompanyProfile.findOne({ where: { user_id: userId } });
    
    if (!companyProfile) {
      return res.status(404).json({ message: 'Şirket profili bulunamadı.' });
    }

    switch (action) {
      case 'create':
        const newDept = await Department.create({
          company_id: companyProfile.id,
          ...req.body.department
        });
        return res.status(201).json({ message: 'Departman oluşturuldu.', department: newDept });

      case 'update':
        const dept = await Department.findOne({
          where: { id: req.body.department_id, company_id: companyProfile.id }
        });
        
        if (!dept) {
          return res.status(404).json({ message: 'Departman bulunamadı.' });
        }

        await dept.update(req.body.updates);
        return res.status(200).json({ message: 'Departman güncellendi.', department: dept });

      case 'delete':
        const deptToDelete = await Department.findOne({
          where: { id: req.body.department_id, company_id: companyProfile.id }
        });
        
        if (!deptToDelete) {
          return res.status(404).json({ message: 'Departman bulunamadı.' });
        }

        await deptToDelete.update({ is_active: false });
        return res.status(200).json({ message: 'Departman silindi.' });

      default:
        return res.status(400).json({ message: 'Geçersiz işlem.' });
    }
  } catch (error) {
    console.error('Departman yönetimi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Mentor yönetimi
exports.manageMentors = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action } = req.body; // 'create', 'update', 'delete', 'assign'

    const companyProfile = await CompanyProfile.findOne({ where: { user_id: userId } });
    
    if (!companyProfile) {
      return res.status(404).json({ message: 'Şirket profili bulunamadı.' });
    }

    switch (action) {
      case 'create':
        // Mentor verisini temizle ve validate et
        const mentorData = {
          company_id: companyProfile.id,
          name: req.body.mentor.name,
          email: req.body.mentor.email,
          phone: req.body.mentor.phone,
          title: req.body.mentor.title,
          is_active: req.body.mentor.is_active !== undefined ? req.body.mentor.is_active : true
        };

        // department_id kontrolü
        if (req.body.mentor.department_id && req.body.mentor.department_id !== '') {
          mentorData.department_id = parseInt(req.body.mentor.department_id);
          
          // Geçerli bir integer olduğundan emin ol
          if (isNaN(mentorData.department_id)) {
            return res.status(400).json({ 
              message: 'Geçersiz departman ID. Sayısal bir değer olmalıdır.' 
            });
          }

          // Departmanın bu şirkete ait olduğunu kontrol et (opsiyonel güvenlik kontrolü)
          const department = await Department.findOne({
            where: { 
              id: mentorData.department_id, 
              company_id: companyProfile.id,
              is_active: true 
            }
          });

          if (!department) {
            return res.status(400).json({ 
              message: 'Belirtilen departman bulunamadı veya bu şirkete ait değil.' 
            });
          }
        }
        // Eğer department_id boş veya geçersizse, null olarak ayarla
        else {
          mentorData.department_id = null;
        }

        const newMentor = await Mentor.create(mentorData);
        
        // Oluşturulan mentoru departman bilgisiyle birlikte döndür
        const mentorWithDept = await Mentor.findByPk(newMentor.id, {
          include: [{ model: Department }]
        });

        return res.status(201).json({ 
          message: 'Mentor başarıyla oluşturuldu.', 
          mentor: mentorWithDept 
        });

      case 'update':
        const mentor = await Mentor.findOne({
          where: { id: req.body.mentor_id, company_id: companyProfile.id }
        });
        
        if (!mentor) {
          return res.status(404).json({ message: 'Mentor bulunamadı.' });
        }

        // Update verilerini temizle
        const updateData = { ...req.body.updates };
        
        // department_id güncelleniyorsa kontrol et
        if ('department_id' in updateData) {
          if (updateData.department_id && updateData.department_id !== '') {
            updateData.department_id = parseInt(updateData.department_id);
            
            if (isNaN(updateData.department_id)) {
              return res.status(400).json({ 
                message: 'Geçersiz departman ID. Sayısal bir değer olmalıdır.' 
              });
            }

            // Departman kontrolü
            const department = await Department.findOne({
              where: { 
                id: updateData.department_id, 
                company_id: companyProfile.id,
                is_active: true 
              }
            });

            if (!department) {
              return res.status(400).json({ 
                message: 'Belirtilen departman bulunamadı veya bu şirkete ait değil.' 
              });
            }
          } else {
            updateData.department_id = null;
          }
        }

        updateData.updated_at = new Date();
        await mentor.update(updateData);
        
        // Güncellenmiş mentoru departman bilgisiyle birlikte döndür
        const updatedMentor = await Mentor.findByPk(mentor.id, {
          include: [{ model: Department }]
        });

        return res.status(200).json({ 
          message: 'Mentor başarıyla güncellendi.', 
          mentor: updatedMentor 
        });

      case 'delete':
        const mentorToDelete = await Mentor.findOne({
          where: { id: req.body.mentor_id, company_id: companyProfile.id }
        });
        
        if (!mentorToDelete) {
          return res.status(404).json({ message: 'Mentor bulunamadı.' });
        }

        // Soft delete - is_active'i false yap
        await mentorToDelete.update({ 
          is_active: false,
          updated_at: new Date()
        });

        return res.status(200).json({ message: 'Mentor başarıyla silindi.' });

      case 'assign':
        const { mentor_id, student_id, placement_id, notes } = req.body;
        
        // Mentor'un şirkete ait olduğunu kontrol et
        const assignMentor = await Mentor.findOne({
          where: { 
            id: mentor_id, 
            company_id: companyProfile.id,
            is_active: true 
          }
        });

        if (!assignMentor) {
          return res.status(404).json({ 
            message: 'Mentor bulunamadı veya aktif değil.' 
          });
        }
        
        // Mevcut atamayı pasif yap
        const existingAssignment = await MentorAssignment.findOne({
          where: { student_id, placement_id, is_active: true }
        });

        if (existingAssignment) {
          await existingAssignment.update({ is_active: false });
        }

        // Yeni atama oluştur
        const assignment = await MentorAssignment.create({
          mentor_id,
          student_id,
          placement_id,
          notes,
          previous_mentor_id: existingAssignment?.mentor_id,
          changed_date: existingAssignment ? new Date() : null,
          change_reason: req.body.change_reason
        });

        return res.status(200).json({ message: 'Mentor ataması yapıldı.', assignment });

      default:
        return res.status(400).json({ message: 'Geçersiz işlem.' });
    }
  } catch (error) {
    console.error('Mentor yönetimi hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Mesajlaşma
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiver_id, placement_id, subject, message, message_type } = req.body;

    const newMessage = await InternshipMessage.create({
      sender_id: senderId,
      receiver_id,
      placement_id,
      subject,
      message,
      message_type: message_type || 'general'
    });

    res.status(201).json({
      message: 'Mesaj gönderildi.',
      sentMessage: newMessage
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Mesajları getir
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { placement_id, message_type } = req.query;

    const whereClause = {
      [Op.or]: [
        { sender_id: userId },
        { receiver_id: userId }
      ]
    };

    if (placement_id) {
      whereClause.placement_id = placement_id;
    }

    if (message_type) {
      whereClause.message_type = message_type;
    }

    const messages = await InternshipMessage.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'Sender', attributes: ['id', 'first_name', 'last_name'] },
        { model: User, as: 'Receiver', attributes: ['id', 'first_name', 'last_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Okunmamış mesajları okundu olarak işaretle
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

    res.status(200).json({ messages });
  } catch (error) {
    console.error('Mesaj getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Dashboard özet bilgileri
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const companyProfile = await CompanyProfile.findOne({ where: { user_id: userId } });
    
    if (!companyProfile) {
      return res.status(404).json({ message: 'Şirket profili bulunamadı.' });
    }

    // Şirketin staj firmalarını bul
    const companyIds = await InternshipCompany.findAll({
      attributes: ['id'],
      where: { name: companyProfile.company_name }
    }).then(companies => companies.map(c => c.id));

    // İstatistikleri topla
    const stats = {
      totalStudents: await InternshipPlacement.count({
        where: {
          company_id: { [Op.in]: companyIds },
          placement_status: { [Op.in]: ['placed', 'placed_alternative'] }
        }
      }),
      pendingApprovals: await InternshipPlacement.count({
        where: {
          company_id: { [Op.in]: companyIds },
          placement_status: { [Op.in]: ['placed', 'placed_alternative'] },
          company_approval_status: 'pending'
        }
      }),
      approvedStudents: await InternshipPlacement.count({
        where: {
          company_id: { [Op.in]: companyIds },
          placement_status: { [Op.in]: ['placed', 'placed_alternative'] },
          company_approval_status: 'approved'
        }
      }),
      rejectedStudents: await InternshipPlacement.count({
        where: {
          company_id: { [Op.in]: companyIds },
          placement_status: { [Op.in]: ['placed', 'placed_alternative'] },
          company_approval_status: 'rejected'
        }
      }),
      activeMentors: await Mentor.count({
        where: { company_id: companyProfile.id, is_active: true }
      }),
      departments: await Department.count({
        where: { company_id: companyProfile.id, is_active: true }
      }),
      unreadMessages: await InternshipMessage.count({
        where: { receiver_id: userId, is_read: false }
      })
    };

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Dashboard özet hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};