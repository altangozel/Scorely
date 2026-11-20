const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinator.controller');
const cvController = require('../controllers/cv.controller');
const { verifyToken, isCoordinator } = require('../middleware/auth.middleware');

// Tüm coordinator rotaları için önce token ve koordinatör yetkisi kontrolü
router.use(verifyToken, isCoordinator);

// Tüm CV'leri getir
router.get('/cvs', coordinatorController.getAllCVs);

// CV detaylarını getir
router.get('/cvs/:id', coordinatorController.getCVDetails);

// CV'yi etiketle veya not ekle
router.put('/cvs/:id/tag', coordinatorController.tagCV);

// En yüksek skorlu CV'leri getir
router.get('/top-cvs', coordinatorController.getTopCVs);

// İstatistikleri getir
router.get('/statistics', coordinatorController.getStatistics);

// CV silme işlemi için yeni rota
router.delete('/cvs/:id', cvController.deleteCVByCoordinator);

module.exports = router;