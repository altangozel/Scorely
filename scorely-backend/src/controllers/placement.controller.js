// controllers/placement.controller.js
const { 
    InternshipPlacement, InternshipApplication, InternshipCompany, 
    User, CV, ProgramCode, sequelize 
  } = require('../models');
  const { Op } = require('sequelize');
  
  // Öğrenci şirket tercihlerini kaydet
  exports.saveStudentPreferences = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      let { program_code, preferences } = req.body;
      
      // Eğer program_code verilmediyse, kullanıcının approved_program_code'unu kullan
      if (!program_code && user.approved_program_code) {
        program_code = user.approved_program_code;
      }
      
      if (!program_code || !preferences || !Array.isArray(preferences)) {
        return res.status(400).json({ message: 'Geçersiz parametreler.' });
      }
      
      // Koordinatör tarafından onaylanmış başvuruyu bul
      const application = await InternshipApplication.findOne({
        where: { 
          user_id: userId, 
          program_code, 
          coordinator_status: 'approved' // Sadece koordinatör onayı yeterli
        }
      });
      
      if (!application) {
        return res.status(404).json({ message: 'Koordinatör tarafından onaylanmış başvuru bulunamadı.' });
      }
      
      // Geçerli şirket ID'lerini kontrol et
      const companyIds = preferences.map(p => p.company_id);
      const companies = await InternshipCompany.findAll({
        where: { 
          id: { [Op.in]: companyIds },
          program_code,
          is_active: true
        }
      });
      
      if (companies.length !== companyIds.length) {
        return res.status(400).json({ message: 'Bir veya daha fazla şirket bulunamadı veya aktif değil.' });
      }
      
      // Transaction başlat
      const transaction = await sequelize.transaction();
      
      try {
        // Mevcut tercihleri sil - RAW SQL kullan
        await sequelize.query(
          `DELETE FROM internship_placements WHERE application_id = ?`,
          {
            replacements: [application.id],
            type: sequelize.QueryTypes.DELETE,
            transaction
          }
        );
        
        // Yeni tercihleri ekle - RAW SQL kullan
        const placements = [];
        for (const pref of preferences) {
          const [result] = await sequelize.query(
            `INSERT INTO internship_placements 
             (application_id, company_id, preference_order, placement_status, company_approval_status, is_visible_to_student, created_at, updated_at) 
             VALUES (?, ?, ?, 'not_placed', NULL, false, NOW(), NOW()) RETURNING *`,
            {
              replacements: [application.id, pref.company_id, pref.preference_order],
              type: sequelize.QueryTypes.INSERT,
              transaction,
              plain: true
            }
          );
          
          placements.push(result);
        }
        
        // Şirket onayını approved olarak işaretle
        await application.update({
          company_status: 'approved',
          company_reviewed_at: new Date()
        }, { transaction });
        
        await transaction.commit();
        
        res.status(200).json({
          message: 'Şirket tercihleri başarıyla kaydedildi.',
          placements
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Tercih kaydetme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  };
  
  // Koordinatör için yerleştirmeleri görüntüleme
  exports.getPlacementsForCoordinator = async (req, res) => {
    try {
      const coordinatorId = req.user.id;
      const { program_code } = req.query;
      
      if (!program_code) {
        return res.status(400).json({ message: 'Program kodu gereklidir.' });
      }
      
      // Program kodunun koordinatöre ait olup olmadığını kontrol et
      const programCode = await ProgramCode.findOne({
        where: { code: program_code, coordinator_id: coordinatorId }
      });
      
      if (!programCode) {
        return res.status(403).json({ message: 'Bu program için yetkiniz yok.' });
      }
      
      // Koordinatör tarafından onaylanmış ve şirket tercihi yapmış başvuruları al
      const applications = await InternshipApplication.findAll({
        where: { 
          program_code, 
          coordinator_status: 'approved',
          company_status: 'approved' // Tercih yapmış olanlar
        },
        include: [
          {
            model: User,
            attributes: ['id', 'first_name', 'last_name', 'email', 'gpa'],
            include: [{ model: CV, attributes: ['total_score'] }]
          }
        ]
      });
      
      // Staj şirketlerini getir
      const companies = await InternshipCompany.findAll({
        where: { program_code, is_active: true },
        attributes: ['id', 'name', 'available_positions']
      });
      
      // Uygulama ID'lerini topla
      const applicationIds = applications.map(app => app.id);
      
      // Yerleştirmeleri ayrı bir SQL sorgusu ile getir
      let placementsData = [];
      
      if (applicationIds.length > 0) {
        placementsData = await sequelize.query(
          `SELECT p.*, c.id as company_id, c.name as company_name 
           FROM internship_placements p
           LEFT JOIN internship_companies c ON p.company_id = c.id
           WHERE p.application_id IN (?)`,
          {
            replacements: [applicationIds],
            type: sequelize.QueryTypes.SELECT
          }
        );
      }
      
      // Verileri birleştir
      const applicationsWithPlacements = applications.map(app => {
        const appData = app.toJSON();
        const appPlacements = placementsData.filter(p => p.application_id === app.id);
        
        appData.InternshipPlacements = appPlacements.map(p => ({
          id: p.id,
          application_id: p.application_id,
          company_id: p.company_id,
          preference_order: p.preference_order,
          placement_status: p.placement_status,
          company_approval_status: p.company_approval_status,
          company_approval_date: p.company_approval_date,
          is_visible_to_student: p.is_visible_to_student,
          InternshipCompany: {
            id: p.company_id,
            name: p.company_name
          }
        }));
        
        return appData;
      });
      
      res.status(200).json({
        applications: applicationsWithPlacements,
        companies
      });
    } catch (error) {
      console.error('Yerleştirme görüntüleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  };
  
  // Yerleştirmeleri hesapla
  exports.calculatePlacements = async (req, res) => {
    try {
      const coordinatorId = req.user.id;
      const { program_code } = req.body;
      
      if (!program_code) {
        return res.status(400).json({ message: 'Program kodu gereklidir.' });
      }
      
      // Program kodunun koordinatöre ait olup olmadığını kontrol et
      const programCode = await ProgramCode.findOne({
        where: { code: program_code, coordinator_id: coordinatorId }
      });
      
      if (!programCode) {
        return res.status(403).json({ message: 'Bu program için yetkiniz yok.' });
      }
      
      // Tercih yapmış başvuruları al
      const applications = await InternshipApplication.findAll({
        where: { 
          program_code, 
          coordinator_status: 'approved',
          company_status: 'approved' // Tercih yapmış olanlar
        },
        include: [
          {
            model: User,
            attributes: ['id', 'first_name', 'last_name', 'email', 'gpa'],
            include: [{ model: CV, attributes: ['total_score'] }]
          }
        ],
        order: [
          [sequelize.literal('"User"."gpa" * COALESCE("User->CVs"."total_score", 0)'), 'DESC']
        ]
      });
      
      if (applications.length === 0) {
        return res.status(404).json({ message: 'Bu program için tercih yapmış öğrenci bulunamadı.' });
      }
      
      // Öğrenci tercihleri
      const applicationIds = applications.map(app => app.id);
      const studentPreferences = await InternshipPlacement.findAll({
        where: { application_id: { [Op.in]: applicationIds } },
        order: [['preference_order', 'ASC']]
      });
      
      // Şirketleri al
      const companies = await InternshipCompany.findAll({
        where: { program_code, is_active: true }
      });
      
      // Yerleştirme algoritması
      const companyCapacity = {};
      companies.forEach(comp => {
        companyCapacity[comp.id] = comp.available_positions;
      });
      
      const transaction = await sequelize.transaction();
      
      try {
        // Tüm yerleştirmeleri "not_placed" olarak işaretle ve şirket onayını sıfırla
        await InternshipPlacement.update(
          { 
            placement_status: 'not_placed',
            company_approval_status: null,
            company_approval_date: null,
            company_approval_notes: null
          },
          { 
            where: { application_id: { [Op.in]: applicationIds } },
            transaction
          }
        );
        
        // Öğrencileri yerleştir
        const placementResults = [];
        
        for (const app of applications) {
          let placed = false;
          
          // Öğrencinin tercihlerini sırayla kontrol et
          const preferences = studentPreferences.filter(pref => pref.application_id === app.id)
            .sort((a, b) => a.preference_order - b.preference_order);
          
          for (const pref of preferences) {
            const companyId = pref.company_id;
            
            // Şirketin aktif olup olmadığını kontrol et
            const company = companies.find(c => c.id === companyId);
            if (!company) continue;
            
            // Şirkette yer var mı kontrol et
            if (companyCapacity[companyId] > 0) {
              // Öğrenciyi yerleştir (ilk aşama - şirket onayı bekliyor)
              await pref.update(
                { 
                  placement_status: 'placed',
                  company_approval_status: 'pending'
                },
                { transaction }
              );
              
              // Şirket kapasitesini azalt
              companyCapacity[companyId]--;
              placed = true;
              
              placementResults.push({
                student: `${app.User.first_name} ${app.User.last_name}`,
                company: company.name,
                preferenceOrder: pref.preference_order
              });
              
              break;
            }
          }
          
          // Yerleşemediyse, alternatif bir şirket bul
          if (!placed) {
            for (const company of companies) {
              if (companyCapacity[company.id] > 0) {
                // Öğrencinin bu şirket için zaten tercih kaydı var mı kontrol et
                let placement = preferences.find(p => p.company_id === company.id);
                
                if (placement) {
                  // Mevcut tercih kaydını güncelle
                  await placement.update(
                    { 
                      placement_status: 'placed_alternative',
                      company_approval_status: 'pending'
                    },
                    { transaction }
                  );
                } else {
                  // Tercih edilmeyen bir şirkete yerleştirme kaydı oluştur
                  placement = await InternshipPlacement.create(
                    {
                      application_id: app.id,
                      company_id: company.id,
                      preference_order: 999, // Tercih dışı
                      placement_status: 'placed_alternative',
                      company_approval_status: 'pending',
                      is_visible_to_student: false
                    },
                    { transaction }
                  );
                }
                
                companyCapacity[company.id]--;
                
                placementResults.push({
                  student: `${app.User.first_name} ${app.User.last_name}`,
                  company: company.name,
                  preferenceOrder: placement.preference_order,
                  alternative: true
                });
                
                break;
              }
            }
          }
        }
        
        await transaction.commit();
        
        res.status(200).json({
          message: 'Yerleştirmeler başarıyla hesaplandı. Şirketler artık öğrencileri onaylayabilir.',
          placements: placementResults,
          statistics: {
            totalStudents: applications.length,
            placedToPreferences: placementResults.filter(p => !p.alternative).length,
            placedToAlternatives: placementResults.filter(p => p.alternative).length
          }
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Yerleştirme hesaplama hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  };
  
  // Yerleştirme sonuçlarını öğrencilere gösterme/gizleme
  exports.togglePlacementVisibility = async (req, res) => {
    try {
      const coordinatorId = req.user.id;
      const { program_code, is_visible } = req.body;
      
      if (!program_code || is_visible === undefined) {
        return res.status(400).json({ message: 'Geçersiz parametreler.' });
      }
      
      // Program kodunun koordinatöre ait olup olmadığını kontrol et
      const programCode = await ProgramCode.findOne({
        where: { code: program_code, coordinator_id: coordinatorId }
      });
      
      if (!programCode) {
        return res.status(403).json({ message: 'Bu program için yetkiniz yok.' });
      }
      
      // Tercih yapmış başvuruları bul
      const applications = await InternshipApplication.findAll({
        where: { 
          program_code, 
          coordinator_status: 'approved',
          company_status: 'approved' // Tercih yapmış olanlar
        },
        attributes: ['id']
      });
      
      if (applications.length === 0) {
        return res.status(404).json({ message: 'Bu program için tercih yapmış öğrenci bulunamadı.' });
      }
      
      // Yerleştirmelerin görünürlüğünü güncelle - RAW SQL kullan
      await sequelize.query(
        `UPDATE internship_placements 
         SET is_visible_to_student = ?, updated_at = NOW() 
         WHERE application_id IN (?)`,
        {
          replacements: [is_visible, applications.map(app => app.id)],
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      res.status(200).json({
        message: `Yerleştirme sonuçları başarıyla ${is_visible ? 'görünür' : 'gizli'} yapıldı.`
      });
    } catch (error) {
      console.error('Görünürlük güncelleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  };
  
  // KALDIRILDI - Şirket onayları artık koordinatör tarafından yapılmıyor
  /*
  exports.updateCompanyApprovals = async (req, res) => {
    // Bu fonksiyon artık kullanılmıyor
  };
  */
  
  // Öğrenci için yerleştirme sonuçlarını getir
  exports.getStudentPlacementResults = async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      let { program_code } = req.query;
      
      // Eğer program_code verilmediyse, kullanıcının approved_program_code'unu kullan
      if (!program_code && user.approved_program_code) {
        program_code = user.approved_program_code;
      }
      
      if (!program_code) {
        return res.status(400).json({ message: 'Program kodu gereklidir veya onaylanmış bir program kodunuz bulunmuyor.' });
      }
      
      // Öğrencinin onaylanmış başvurusunu bul
      const application = await InternshipApplication.findOne({
        where: { 
          user_id: userId, 
          program_code, 
          coordinator_status: 'approved'
        }
      });
      
      if (!application) {
        return res.status(404).json({ message: 'Koordinatör tarafından onaylanmış başvuru bulunamadı.' });
      }
      
      // Yerleştirme sonuçlarını doğrudan SQL ile getir
      const placements = await sequelize.query(
        `SELECT p.*, c.id as company_id, c.name as company_name, c.location as company_location, c.description as company_description 
         FROM internship_placements p
         LEFT JOIN internship_companies c ON p.company_id = c.id
         WHERE p.application_id = ?
         ORDER BY p.preference_order ASC`,
        {
          replacements: [application.id],
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      // Sonuçların görünür olup olmadığını kontrol et
      const anyVisible = placements.some(p => p.is_visible_to_student);
      
      if (!anyVisible) {
        return res.status(403).json({ 
          message: 'Yerleştirme sonuçları henüz açıklanmadı.',
          placements: placements.map(p => ({
            company_name: p.company_name,
            preference_order: p.preference_order
          }))
        });
      }
      
      res.status(200).json({
        placements: placements.map(p => ({
          company_id: p.company_id,
          company_name: p.company_name,
          company_location: p.company_location,
          company_description: p.company_description,
          preference_order: p.preference_order,
          placement_status: p.placement_status,
          company_approval_status: p.company_approval_status,
          company_approval_date: p.company_approval_date,
          company_approval_notes: p.company_approval_notes,
          is_visible: p.is_visible_to_student
        }))
      });
    } catch (error) {
      console.error('Yerleştirme görüntüleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  };