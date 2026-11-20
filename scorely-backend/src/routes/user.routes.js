// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isCoordinator } = require('../middleware/auth.middleware');

// Öğrenci GPA güncelleme rota
router.put('/update-gpa', verifyToken, userController.updateStudentGPA);

// Koordinatör tarafından öğrenci GPA güncelleme rota
router.put('/coordinator/update-student-gpa/:userId', verifyToken, isCoordinator, userController.updateStudentGPAByCoordinator);

module.exports = router;