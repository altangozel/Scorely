const express = require('express');
const router = express.Router();
const employerController = require('../controllers/employer.controller');
const { verifyToken, isEmployer } = require('../middleware/auth.middleware');

// Tüm employer rotaları için önce token ve işveren yetkisi kontrolü
router.use(verifyToken, isEmployer);

// Şirket profili
router.get('/profile', employerController.getCompanyProfile);
router.put('/profile', employerController.updateCompanyProfile);

// Dashboard
router.get('/dashboard/summary', employerController.getDashboardSummary);

// Öğrenci yönetimi
router.get('/students', employerController.getAssignedStudents);
router.put('/students/:placement_id/approval', employerController.updateStudentApproval);

// Departman yönetimi
router.post('/departments', employerController.manageDepartments);

// Mentor yönetimi
router.post('/mentors', employerController.manageMentors);

// Mesajlaşma
router.get('/messages', employerController.getMessages);
router.post('/messages', employerController.sendMessage);

module.exports = router;