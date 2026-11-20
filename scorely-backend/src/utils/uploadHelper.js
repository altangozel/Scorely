const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// CV'ler için depolama ayarları
const cvStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/cvs'));
  },
  filename: function(req, file, cb) {
    const originalExt = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${originalExt}`;
    cb(null, uniqueFileName);
  }
});

// CV yükleme için multer ayarları
const uploadCV = multer({
  storage: cvStorage,
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    const allowedFileTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedFileTypes.includes(ext)) {
      return cb(new Error('Sadece PDF ve DOCX dosyaları kabul edilir.'), false);
    }
    
    cb(null, true);
  }
});

// Transkript için depolama ayarları
const transcriptStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = path.join(__dirname, '../uploads/transcripts');
    // Dizin yoksa oluştur
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    const originalExt = path.extname(file.originalname);
    const uniqueFileName = `transcript-${uuidv4()}${originalExt}`;
    cb(null, uniqueFileName);
  }
});

// Transkript yükleme için multer ayarları
const uploadTranscript = multer({
  storage: transcriptStorage,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB limit
  },
  fileFilter: function(req, file, cb) {
    const allowedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedFileTypes.includes(ext)) {
      return cb(new Error('Sadece PDF, JPG ve PNG dosyaları kabul edilir.'), false);
    }
    
    cb(null, true);
  }
});

// Geçici dosya yükleme için depolama
const tempStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/temp'));
  },
  filename: function(req, file, cb) {
    const uniqueFileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFileName);
  }
});

const uploadTemp = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB limit
  }
});

// Dosya silme yardımcısı
const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
};

module.exports = {
  uploadCV,
  uploadTranscript,
  uploadTemp,
  deleteFile
};