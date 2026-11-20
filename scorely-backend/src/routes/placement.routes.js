// routes/placement.routes.js
const express = require('express');
const router = express.Router();
const placementController = require('../controllers/placement.controller');
const { verifyToken, isCoordinator, isStudent } = require('../middleware/auth.middleware');

// Öğrenci rotaları
router.post('/student/save-preferences', verifyToken, isStudent, placementController.saveStudentPreferences);
router.get('/student/results', verifyToken, isStudent, placementController.getStudentPlacementResults);

// Koordinatör rotaları
router.get('/coordinator/all', verifyToken, isCoordinator, placementController.getPlacementsForCoordinator);
router.post('/coordinator/calculate', verifyToken, isCoordinator, placementController.calculatePlacements);
router.post('/coordinator/toggle-visibility', verifyToken, isCoordinator, placementController.togglePlacementVisibility);
// KALDIRILDI: router.post('/coordinator/update-company-approvals', verifyToken, isCoordinator, placementController.updateCompanyApprovals);

module.exports = router;