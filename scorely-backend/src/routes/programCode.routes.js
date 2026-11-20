// routes/programCode.routes.js
const express = require('express');
const router = express.Router();
const programCodeController = require('../controllers/programCode.controller');
const { verifyToken, isCoordinator } = require('../middleware/auth.middleware');

// Tüm rotalar için token ve koordinatör yetkisi kontrolü
router.use(verifyToken);

// Program kodu doğrulama (öğrenci erişimi için)
router.post('/validate', programCodeController.validateProgramCode);

// Koordinatör rotaları
router.use(isCoordinator);
router.get('/', programCodeController.getAllProgramCodes);
router.post('/create', programCodeController.createProgramCode);
router.put('/:id/toggle', programCodeController.toggleProgramCode);

module.exports = router;