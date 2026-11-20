const { CV, User, Role, sequelize } = require('../models');
const { Op } = require('sequelize');

// Tüm CV'leri getir ve skorlarına göre sırala
exports.getAllCVs = async (req, res) => {
  try {
    const { sort = 'desc', limit = 50, offset = 0, search = '' } = req.query;
    
    // Arama ve filtreleme seçenekleri
    const whereCondition = {};
    
    // Kullanıcıları da dahil et
    const usersInclude = {
      model: User,
      attributes: ['id', 'first_name', 'last_name', 'email', 'tckn', 'phone_number'],
      include: [{ model: Role, attributes: ['name'] }]
    };
    
    // Eğer arama parametresi varsa kullanıcı bilgilerinde ara
    if (search) {
      usersInclude.where = {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { tckn: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    // CV'leri getir
    const cvs = await CV.findAndCountAll({
      include: [usersInclude],
      order: [['total_score', sort]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id', 'file_type', 'original_filename', 'extracted_skills', 
        'estimated_experience_years', 'education_level', 'education_score',
        'language_skills', 'total_score', 'skill_score', 'experience_score',
        'language_score', 'tags', 'coordinator_notes', 'created_at', 'updated_at', 'last_processed_at'
      ]
    });

    res.status(200).json({
      total: cvs.count,
      cvs: cvs.rows.map(cv => ({
        id: cv.id,
        file_type: cv.file_type,
        original_filename: cv.original_filename,
        skills: cv.extracted_skills || [],
        experience_years: cv.estimated_experience_years || 0,
        education_level: cv.education_level || 'unknown',
        education_score: cv.education_score || 0,
        languages: cv.language_skills || [],
        total_score: cv.total_score || 0,
        skill_score: cv.skill_score || 0,
        experience_score: cv.experience_score || 0,
        language_score: cv.language_score || 0,
        tags: cv.tags || [],
        coordinator_notes: cv.coordinator_notes || '',
        created_at: cv.created_at,
        updated_at: cv.updated_at,
        last_processed_at: cv.last_processed_at,
        user: {
          id: cv.User.id,
          first_name: cv.User.first_name,
          last_name: cv.User.last_name,
          email: cv.User.email,
          tckn: cv.User.tckn || '',
          phone_number: cv.User.phone_number || '',
          role: cv.User.Role ? cv.User.Role.name : 'student'
        }
      }))
    });
  } catch (error) {
    console.error('CV listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// CV detaylarını getir
exports.getCVDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cv = await CV.findByPk(id, {
      include: [{
        model: User,
        attributes: ['id', 'first_name', 'last_name', 'email', 'tckn', 'phone_number'],
        include: [{ model: Role, attributes: ['name'] }]
      }],
      attributes: [
        'id', 'file_path', 'file_type', 'original_filename', 'content_text', 'extracted_skills', 
        'estimated_experience_years', 'education_level', 'education_score',
        'language_skills', 'total_score', 'skill_score', 'experience_score',
        'language_score', 'tags', 'coordinator_notes', 'created_at', 'updated_at', 'last_processed_at'
      ]
    });

    if (!cv) {
      return res.status(404).json({ message: 'CV bulunamadı.' });
    }

    // CV analizi
    const score = cv.total_score || 0;
    let evaluation = '';
    
    // Puana göre değerlendirme
    if (score >= 90) {
      evaluation = 'Mükemmel CV! Üst düzey pozisyonlar için ideal.';
    } else if (score >= 75) {
      evaluation = 'Çok iyi CV. Kıdemli rollere uygun.';
    } else if (score >= 60) {
      evaluation = 'İyi CV. Orta seviye pozisyonlar için uygun.';
    } else if (score >= 40) {
      evaluation = 'Geliştirilmesi gereken alanlar var. Junior pozisyonlar için uygun.';
    } else {
      evaluation = 'CV\'yi geliştirmesi önerilir. Daha fazla deneyim, beceri ve eğitim detayı eklemeli.';
    }

    // İyileştirme önerileri
    const improvementSuggestions = [];
    
    // Beceri önerileri
    if (cv.skill_score < 60) {
      improvementSuggestions.push('Daha fazla teknik beceri eklemeli. Özellikle güncel teknolojiler ve framework\'ler.');
    }
    
    // Deneyim önerileri
    if (cv.experience_score < 50) {
      improvementSuggestions.push('Deneyimlerini daha detaylı açıklamalı ve başarılarını sayısal verilerle desteklemeli.');
    }
    
    // Eğitim önerileri
    if (cv.education_score < 40) {
      improvementSuggestions.push('Eğitim bilgilerini daha net belirtmeli. Varsa projeler, dersler veya akademik başarılardan bahsetmeli.');
    }
    
    // Dil önerileri
    if (cv.language_score < 50) {
      improvementSuggestions.push('Dil yetkinliklerini seviyesiyle birlikte belirtmeli (örn: İngilizce - İleri Seviye).');
    }

    res.status(200).json({
      cv: {
        id: cv.id,
        file_path: cv.file_path,
        file_type: cv.file_type,
        original_filename: cv.original_filename,
        skills: cv.extracted_skills || [],
        experience_years: cv.estimated_experience_years || 0,
        education_level: cv.education_level || 'unknown',
        education_score: cv.education_score || 0,
        languages: cv.language_skills || [],
        total_score: cv.total_score || 0,
        skill_score: cv.skill_score || 0,
        experience_score: cv.experience_score || 0,
        language_score: cv.language_score || 0,
        tags: cv.tags || [],
        coordinator_notes: cv.coordinator_notes || '',
        created_at: cv.created_at,
        updated_at: cv.updated_at,
        last_processed_at: cv.last_processed_at,
        evaluation: evaluation,
        improvement_suggestions: improvementSuggestions,
        user: {
          id: cv.User.id,
          first_name: cv.User.first_name,
          last_name: cv.User.last_name,
          email: cv.User.email,
          tckn: cv.User.tckn || '',
          phone_number: cv.User.phone_number || '',
          role: cv.User.Role ? cv.User.Role.name : 'student'
        }
      }
    });
  } catch (error) {
    console.error('CV detay hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// CV'leri etiketle veya not ekle
exports.tagCV = async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, coordinator_notes } = req.body;
    
    const cv = await CV.findByPk(id);

    if (!cv) {
      return res.status(404).json({ message: 'CV bulunamadı.' });
    }

    // CV'yi güncelle
    await cv.update({
      tags: tags || [],
      coordinator_notes: coordinator_notes || '',
      updated_at: new Date()
    });

    res.status(200).json({
      message: 'CV başarıyla güncellendi.',
      cv: {
        id: cv.id,
        tags: tags || [],
        coordinator_notes: coordinator_notes || ''
      }
    });
  } catch (error) {
    console.error('CV etiketleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// En yüksek skora sahip CV'leri getir
exports.getTopCVs = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const cvs = await CV.findAll({
      include: [{
        model: User,
        attributes: ['id', 'first_name', 'last_name', 'email'],
        include: [{ model: Role, attributes: ['name'] }]
      }],
      order: [['total_score', 'DESC']],
      limit: parseInt(limit),
      attributes: [
        'id', 'total_score', 'skill_score', 'experience_score', 
        'education_score', 'language_score', 'extracted_skills'
      ]
    });

    res.status(200).json({
      cvs: cvs.map(cv => ({
        id: cv.id,
        total_score: cv.total_score || 0,
        skill_score: cv.skill_score || 0,
        experience_score: cv.experience_score || 0,
        education_score: cv.education_score || 0,
        language_score: cv.language_score || 0,
        skills: cv.extracted_skills && cv.extracted_skills.length > 5 
          ? cv.extracted_skills.slice(0, 5) 
          : (cv.extracted_skills || []),
        user: {
          id: cv.User.id,
          name: `${cv.User.first_name} ${cv.User.last_name}`,
          email: cv.User.email,
          role: cv.User.Role ? cv.User.Role.name : 'student'
        }
      }))
    });
  } catch (error) {
    console.error('En iyi CV\'leri getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// İstatistikler ve özet bilgiler
exports.getStatistics = async (req, res) => {
  try {
    // Toplam CV sayısı
    const totalCVs = await CV.count();
    
    // Ortalama skorlar
    const averageScores = await CV.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.col('total_score')), 'avg_total_score'],
        [sequelize.fn('AVG', sequelize.col('skill_score')), 'avg_skill_score'],
        [sequelize.fn('AVG', sequelize.col('experience_score')), 'avg_experience_score'],
        [sequelize.fn('AVG', sequelize.col('education_score')), 'avg_education_score'],
        [sequelize.fn('AVG', sequelize.col('language_score')), 'avg_language_score']
      ],
      raw: true
    });
    
    // En yaygın beceriler
    const allCVs = await CV.findAll({
      attributes: ['extracted_skills']
    });
    
    const skillCounter = {};
    allCVs.forEach(cv => {
      const skills = cv.extracted_skills || [];
      skills.forEach(skill => {
        if (skillCounter[skill]) {
          skillCounter[skill]++;
        } else {
          skillCounter[skill] = 1;
        }
      });
    });
    
    // En yaygın becerileri bul (ilk 10)
    const topSkills = Object.entries(skillCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));
    
    // Eğitim seviyelerine göre dağılım
    const educationLevels = await CV.findAll({
      attributes: ['education_level', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['education_level'],
      raw: true
    });
    
    // Skor aralığına göre dağılım
    const excellentCVs = await CV.count({ where: { total_score: { [Op.gte]: 90 } } });
    const veryGoodCVs = await CV.count({ where: { total_score: { [Op.between]: [75, 89] } } });
    const goodCVs = await CV.count({ where: { total_score: { [Op.between]: [60, 74] } } });
    const fairCVs = await CV.count({ where: { total_score: { [Op.between]: [40, 59] } } });
    const needsImprovementCVs = await CV.count({ where: { total_score: { [Op.lt]: 40 } } });

    const scoreRanges = {
      'excellent': excellentCVs,
      'very_good': veryGoodCVs,
      'good': goodCVs,
      'fair': fairCVs,
      'needs_improvement': needsImprovementCVs
    };

    res.status(200).json({
      total_cvs: totalCVs,
      average_scores: {
        total: parseFloat(averageScores[0]?.avg_total_score) || 0,
        skill: parseFloat(averageScores[0]?.avg_skill_score) || 0,
        experience: parseFloat(averageScores[0]?.avg_experience_score) || 0,
        education: parseFloat(averageScores[0]?.avg_education_score) || 0,
        language: parseFloat(averageScores[0]?.avg_language_score) || 0
      },
      top_skills: topSkills,
      education_distribution: educationLevels,
      score_distribution: scoreRanges,
      excellent_cvs: excellentCVs,
      needs_improvement_cvs: needsImprovementCVs
    });
  } catch (error) {
    console.error('İstatistik getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// CV silme işlemi
exports.deleteCV = async (req, res) => {
  try {
    const { id } = req.params;
    
    // CV'yi bul
    const cv = await CV.findByPk(id);

    if (!cv) {
      return res.status(404).json({ message: 'CV bulunamadı.' });
    }

    // Dosyayı diskten sil
    const filePath = path.join(__dirname, '..', cv.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // CV kaydını veritabanından sil
    await cv.destroy();

    res.status(200).json({ message: 'CV başarıyla silindi.' });
  } catch (error) {
    console.error('CV silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};