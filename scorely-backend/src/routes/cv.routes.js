const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cv.controller');
const { verifyToken, isAdmin, isEmployer } = require('../middleware/auth.middleware');
const { uploadCV } = require('../utils/uploadHelper');

// CV yükleme (tek dosya)
router.post('/upload', verifyToken, uploadCV.single('cv'), cvController.uploadCV);

// Kullanıcının kendi CV'sini görüntüleme
router.get('/my-cv', verifyToken, cvController.getUserCV);

// CV analizi
router.get('/analyze', verifyToken, cvController.analyzeCV);

// CV'yi yeniden analiz et
router.post('/reanalyze', verifyToken, cvController.reanalyzeCV);

// Token gerektirmeyen CV indirme rotası
router.get('/download/:id', verifyToken, cvController.downloadCV);

// CV silme (kullanıcı kendi CV'sini silebilir)
router.delete('/delete', verifyToken, cvController.deleteCV);

module.exports = router;