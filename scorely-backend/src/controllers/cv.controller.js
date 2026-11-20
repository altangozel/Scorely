const path = require('path');
const fs = require('fs');
const { CV, User } = require('../models');
const { extractTextFromFile } = require('../utils/textExtractor');
const { deleteFile } = require('../utils/uploadHelper');
const { canAccessStudent } = require('../middleware/studentAccess');
const { 
  extractSkillsFromText, 
  estimateExperienceYears, 
  extractEducationLevel,
  extractLanguageSkills,
  scoreCV
} = require('../utils/skillExtractor');

// CV Yükleme
exports.uploadCV = async (req, res) => {
  try {
    // Kullanici kontrolü (JWT token'dan gelen id)
    const userId = req.user.id;

    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir CV dosyasi yükleyin.' });
    }

    // Dosya bilgilerini al
    const { filename, originalname, mimetype, path: filePath, size } = req.file;
    
    // Dosya tipini belirle
    let fileType = '';
    if (mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
               mimetype === 'application/msword') {
      fileType = 'docx';
    } else {
      // Desteklenmeyen dosya tipi ise dosyayi sil ve hata döndür
      deleteFile(filePath);
      return res.status(400).json({ message: 'Desteklenmeyen dosya formati.' });
    }

    // CV'den metin içerigi çikar
    let contentText = '';
    let extractedSkills = [];
    let estimatedExperienceYears = 0;
    let educationInfo = { level: 'unknown', score: 0 };
    let languageSkills = [];
    let cvScore = { totalScore: 0, details: {} };

    try {
      contentText = await extractTextFromFile(filePath);
      
      // Tüm CV analizlerini yap
      if (contentText) {
        extractedSkills = extractSkillsFromText(contentText);
        estimatedExperienceYears = estimateExperienceYears(contentText);
        educationInfo = extractEducationLevel(contentText);
        languageSkills = extractLanguageSkills(contentText);
        cvScore = scoreCV(contentText);
      }
    } catch (error) {
      console.error("Metin çikarma hatasi:", error);
      // Metin çikarma basarisiz olsa bile isleme devam et
    }

    // Kullanicinin mevcut CV'sini kontrol et
    const existingCV = await CV.findOne({ where: { user_id: userId } });

    if (existingCV) {
      // Eski dosyayi sil
      const oldFilePath = path.join(__dirname, '..', existingCV.file_path);
      deleteFile(oldFilePath);

      // Mevcut CV'yi güncelle
      await existingCV.update({
        file_path: `uploads/cvs/${filename}`,
        file_type: fileType,
        original_filename: originalname,
        content_text: contentText,
        extracted_skills: extractedSkills,
        estimated_experience_years: estimatedExperienceYears,
        education_level: educationInfo.level,
        education_score: educationInfo.score,
        language_skills: languageSkills,
        total_score: cvScore.totalScore,
        skill_score: cvScore.details.skillScore,
        experience_score: cvScore.details.experienceScore,
        language_score: cvScore.details.languageScore,
        last_processed_at: new Date(),
        updated_at: new Date()
      });

      return res.status(200).json({
        message: 'CV basariyla güncellendi.',
        cv: {
          id: existingCV.id,
          filename: filename,
          original_filename: originalname,
          file_type: fileType,
          skills: extractedSkills,
          experience_years: estimatedExperienceYears,
          education_level: educationInfo.level,
          languages: languageSkills,
          total_score: cvScore.totalScore,
          created_at: existingCV.created_at,
          updated_at: existingCV.updated_at
        }
      });
    } else {
      // Yeni CV olustur
      const newCV = await CV.create({
        user_id: userId,
        file_path: `uploads/cvs/${filename}`,
        file_type: fileType,
        original_filename: originalname,
        content_text: contentText,
        extracted_skills: extractedSkills,
        estimated_experience_years: estimatedExperienceYears,
        education_level: educationInfo.level,
        education_score: educationInfo.score,
        language_skills: languageSkills,
        total_score: cvScore.totalScore,
        skill_score: cvScore.details.skillScore,
        experience_score: cvScore.details.experienceScore,
        language_score: cvScore.details.languageScore,
        last_processed_at: new Date(),
        is_encrypted: true
      });

      return res.status(201).json({
        message: 'CV basariyla yüklendi.',
        cv: {
          id: newCV.id,
          filename: filename,
          original_filename: originalname,
          file_type: fileType,
          skills: extractedSkills,
          experience_years: estimatedExperienceYears,
          education_level: educationInfo.level,
          languages: languageSkills,
          total_score: cvScore.totalScore,
          created_at: newCV.created_at,
          updated_at: newCV.updated_at
        }
      });
    }
  } catch (error) {
    console.error('CV yükleme hatasi:', error);
    res.status(500).json({ message: 'Sunucu hatasi', error: error.message });
  }
};

// Kullanicinin CV'sini getirme
exports.getUserCV = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cv = await CV.findOne({
      where: { user_id: userId },
      attributes: [
        'id', 'file_path', 'file_type', 'original_filename', 
        'extracted_skills', 'estimated_experience_years', 
        'education_level', 'education_score', 'language_skills',
        'total_score', 'skill_score', 'experience_score', 'language_score',
        'created_at', 'updated_at', 'last_processed_at'
      ]
    });

    if (!cv) {
      return res.status(404).json({ message: 'Kullaniciya ait CV bulunamadi.' });
    }

    res.status(200).json({ 
      cv: {
        id: cv.id,
        file_type: cv.file_type,
        original_filename: cv.original_filename,
        skills: cv.extracted_skills,
        experience_years: cv.estimated_experience_years,
        education_level: cv.education_level,
        education_score: cv.education_score,
        languages: cv.language_skills,
        total_score: cv.total_score,
        skill_score: cv.skill_score,
        experience_score: cv.experience_score,
        language_score: cv.language_score,
        created_at: cv.created_at,
        updated_at: cv.updated_at,
        last_processed_at: cv.last_processed_at
      } 
    });
  } catch (error) {
    console.error('CV getirme hatasi:', error);
    res.status(500).json({ message: 'Sunucu hatasi', error: error.message });
  }
};

// CV içerigini analiz etme
exports.analyzeCV = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cv = await CV.findOne({
      where: { user_id: userId },
      attributes: [
        'id', 'content_text', 'extracted_skills', 'estimated_experience_years',
        'education_level', 'education_score', 'language_skills',
        'total_score', 'skill_score', 'experience_score', 'language_score'
      ]
    });

    if (!cv) {
      return res.status(404).json({ message: 'Kullaniciya ait CV bulunamadi.' });
    }

    const score = cv.total_score || 0;
    let evaluation = '';
    
    // Puana göre degerlendirme
    if (score >= 90) {
      evaluation = 'Mükemmel CV! Üst düzey pozisyonlar için ideal.';
    } else if (score >= 75) {
      evaluation = 'Çok iyi CV. Kidemli rollere uygun.';
    } else if (score >= 60) {
      evaluation = 'Iyi CV. Orta seviye pozisyonlar için uygun.';
    } else if (score >= 40) {
      evaluation = 'Gelistirilmesi gereken alanlar var. Junior pozisyonlar için uygun.';
    } else {
      evaluation = 'CV\'nizi gelistirmeniz önerilir. Daha fazla deneyim, beceri ve egitim detayi ekleyin.';
    }

    // Iyilestirme önerileri
    const improvementSuggestions = [];
    
    // Beceri önerileri
    if (cv.skill_score < 60) {
      improvementSuggestions.push('Daha fazla teknik beceri ekleyin. Özellikle güncel teknolojiler ve framework\'ler.');
    }
    
    // Deneyim önerileri
    if (cv.experience_score < 50) {
      improvementSuggestions.push('Deneyimlerinizi daha detayli açiklayin ve basarilarinizi sayisal verilerle destekleyin.');
    }
    
    // Egitim önerileri
    if (cv.education_score < 40) {
      improvementSuggestions.push('Egitim bilgilerinizi daha net belirtin. Varsa projeler, dersler veya akademik basarilardan bahsedin.');
    }
    
    // Dil önerileri
    if (cv.language_score < 50) {
      improvementSuggestions.push('Dil yetkinliklerinizi seviyesiyle birlikte belirtin (örn: Ingilizce - Ileri Seviye).');
    }

    // Mevcut analizleri döndür
    res.status(200).json({
      analysis: {
        skills: cv.extracted_skills,
        skill_count: cv.extracted_skills ? cv.extracted_skills.length : 0,
        skill_score: cv.skill_score,
        experience_years: cv.estimated_experience_years,
        experience_score: cv.experience_score,
        education_level: cv.education_level,
        education_score: cv.education_score,
        languages: cv.language_skills,
        language_score: cv.language_score,
        total_score: cv.total_score,
        evaluation: evaluation,
        improvement_suggestions: improvementSuggestions
      }
    });
  } catch (error) {
    console.error('CV analiz hatasi:', error);
    res.status(500).json({ message: 'Sunucu hatasi', error: error.message });
  }
};



// CV dosyasını indirme
exports.downloadCV = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Token kontrolü olmadan doğrudan CV'yi bul
    const cv = await CV.findOne({ where: { id } });

    if (!cv) {
      return res.status(404).json({ message: 'CV bulunamadı.' });
    }

    if (!(await canAccessStudent(req, cv.user_id))) return res.status(403).json({ message: 'Bu CV dosyasına erişim yetkiniz yok.' });
    const filePath = path.join(__dirname, '..', cv.file_path);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'CV dosyası bulunamadı.' });
    }

    // MIME türünü belirle
    let contentType = 'application/octet-stream'; // Varsayılan
    if (cv.file_type === 'pdf') {
      contentType = 'application/pdf';
    } else if (cv.file_type === 'docx') {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (cv.file_type === 'doc') {
      contentType = 'application/msword';
    }

    // Content-Type ve Content-Disposition header'larını ayarla
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cv.original_filename)}"`);
    
    // Dosyayı doğrudan gönder
    const fileData = fs.readFileSync(filePath);
    return res.end(fileData);
  } catch (error) {
    console.error('CV indirme hatası:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'CV indirilirken hata oluştu.', error: error.message });
    }
  }
};

// Koordinatör tarafından CV silme
exports.deleteCVByCoordinator = async (req, res) => {
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

// CV silme
exports.deleteCV = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cv = await CV.findOne({ where: { user_id: userId } });

    if (!cv) {
      return res.status(404).json({ message: 'Kullaniciya ait CV bulunamadi.' });
    }

    // Dosyayi diskten sil
    const filePath = path.join(__dirname, '..', cv.file_path);
    deleteFile(filePath);

    // CV kaydini veritabanindan sil
    await cv.destroy();

    res.status(200).json({ message: 'CV basariyla silindi.' });
  } catch (error) {
    console.error('CV silme hatasi:', error);
    res.status(500).json({ message: 'Sunucu hatasi', error: error.message });
  }
};

// CV'yi yeniden analiz et
exports.reanalyzeCV = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cv = await CV.findOne({ where: { user_id: userId } });

    if (!cv) {
      return res.status(404).json({ message: 'Kullaniciya ait CV bulunamadi.' });
    }

    // CV içerigini tekrar analiz et
    if (cv.content_text) {
      const extractedSkills = extractSkillsFromText(cv.content_text);
      const estimatedExperienceYears = estimateExperienceYears(cv.content_text);
      const educationInfo = extractEducationLevel(cv.content_text);
      const languageSkills = extractLanguageSkills(cv.content_text);
      const cvScore = scoreCV(cv.content_text);

      // CV'yi güncelle
      await cv.update({
        extracted_skills: extractedSkills,
        estimated_experience_years: estimatedExperienceYears,
        education_level: educationInfo.level,
        education_score: educationInfo.score,
        language_skills: languageSkills,
        total_score: cvScore.totalScore,
        skill_score: cvScore.details.skillScore,
        experience_score: cvScore.details.experienceScore,
        language_score: cvScore.details.languageScore,
        last_processed_at: new Date(),
        updated_at: new Date()
      });

      return res.status(200).json({
        message: 'CV basariyla yeniden analiz edildi.',
        analysis: {
          skills: extractedSkills,
          skill_count: extractedSkills.length,
          skill_score: cvScore.details.skillScore,
          experience_years: estimatedExperienceYears,
          experience_score: cvScore.details.experienceScore,
          education_level: educationInfo.level,
          education_score: educationInfo.score,
          languages: languageSkills,
          language_score: cvScore.details.languageScore,
          total_score: cvScore.totalScore
        }
      });
    } else {
      return res.status(400).json({ message: 'CV içerigi bulunamadi. Yeniden yüklemeyi deneyin.' });
    }
  } catch (error) {
    console.error('CV yeniden analiz hatasi:', error);
    res.status(500).json({ message: 'Sunucu hatasi', error: error.message });
  }
};