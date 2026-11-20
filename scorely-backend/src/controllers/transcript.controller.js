const path = require('path');
const fs = require('fs');
const { StudentTranscript, User } = require('../models');
const { deleteFile } = require('../utils/uploadHelper');
const { canAccessStudent } = require('../middleware/studentAccess');

// Transkript yükleme
exports.uploadTranscript = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({ message: 'Lütfen bir transkript dosyası yükleyin.' });
    }

    const { filename, originalname, mimetype, path: filePath } = req.file;
    
    // Dosya tipini belirle
    let fileType = '';
    if (mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
      fileType = 'jpg';
    } else if (mimetype === 'image/png') {
      fileType = 'png';
    } else {
      deleteFile(filePath);
      return res.status(400).json({ message: 'Desteklenmeyen dosya formatı. PDF, JPG veya PNG yükleyin.' });
    }

    // GPA değerini al (opsiyonel)
    const gpa = req.body.gpa ? parseFloat(req.body.gpa) : null;

    // Mevcut aktif transkriptleri pasif yap
    await StudentTranscript.update(
      { is_active: false },
      { where: { student_id: studentId, is_active: true } }
    );

    // Yeni transkript oluştur
    const transcript = await StudentTranscript.create({
      student_id: studentId,
      file_path: `uploads/transcripts/${filename}`,
      file_type: fileType,
      original_filename: originalname,
      gpa: gpa
    });

    // Eğer GPA girilmişse öğrencinin GPA'sını güncelle
    if (gpa) {
      await User.update(
        { gpa },
        { where: { id: studentId } }
      );
    }

    res.status(201).json({
      message: 'Transkript başarıyla yüklendi.',
      transcript
    });
  } catch (error) {
    console.error('Transkript yükleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Öğrenci transkriptlerini getir
exports.getStudentTranscripts = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.user.id;
    if (!(await canAccessStudent(req, studentId))) return res.status(403).json({ message: 'Bu transkriptlere erişim yetkiniz yok.' });
    const transcripts = await StudentTranscript.findAll({
      where: { student_id: studentId },
      order: [['upload_date', 'DESC']]
    });

    res.status(200).json({ transcripts });
  } catch (error) {
    console.error('Transkript getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Transkript indirme
exports.downloadTranscript = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transcript = await StudentTranscript.findByPk(id);

    if (!transcript) {
      return res.status(404).json({ message: 'Transkript bulunamadı.' });
    }

    if (!(await canAccessStudent(req, transcript.student_id))) return res.status(403).json({ message: 'Bu transkripte erişim yetkiniz yok.' });
    const filePath = path.join(__dirname, '..', transcript.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Transkript dosyası bulunamadı.' });
    }

    // MIME türünü belirle
    let contentType = 'application/octet-stream';
    if (transcript.file_type === 'pdf') {
      contentType = 'application/pdf';
    } else if (transcript.file_type === 'jpg' || transcript.file_type === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (transcript.file_type === 'png') {
      contentType = 'image/png';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(transcript.original_filename)}"`);
    
    const fileData = fs.readFileSync(filePath);
    return res.end(fileData);
  } catch (error) {
    console.error('Transkript indirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Koordinatör transkript doğrulama
exports.verifyTranscript = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;
    
    const transcript = await StudentTranscript.findByPk(id);

    if (!transcript) {
      return res.status(404).json({ message: 'Transkript bulunamadı.' });
    }

    if (!(await canAccessStudent(req, transcript.student_id))) return res.status(403).json({ message: 'Bu transkripti onaylama yetkiniz yok.' });
    await transcript.update({
      verified_by_coordinator: verified,
      verification_date: new Date(),
      verification_notes: notes
    });

    res.status(200).json({
      message: 'Transkript doğrulama durumu güncellendi.',
      transcript
    });
  } catch (error) {
    console.error('Transkript doğrulama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};