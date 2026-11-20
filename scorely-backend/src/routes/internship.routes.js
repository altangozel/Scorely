// routes/internship.routes.js
const express = require('express');
const router = express.Router();
const internshipController = require('../controllers/internship.controller');
const { verifyToken, isCoordinator, isStudent } = require('../middleware/auth.middleware');

// Tüm rotalar için token kontrolü
router.use(verifyToken);

// Öğrenci rotaları
router.post('/apply', isStudent, internshipController.applyForInternship);
router.get('/my-applications', isStudent, internshipController.getMyApplications);
router.delete('/applications/:id/withdraw', isStudent, internshipController.withdrawApplication); // YENİ

// Koordinatör rotaları
router.get('/applications', isCoordinator, internshipController.getProgramApplications);
router.put('/applications/:id/status', isCoordinator, internshipController.updateApplicationStatus);
router.post('/applications/:id/revoke', isCoordinator, internshipController.revokeApproval);

module.exports = router;