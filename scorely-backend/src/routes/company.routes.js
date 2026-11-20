// routes/company.routes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { verifyToken, isCoordinator, isStudent } = require('../middleware/auth.middleware');

// Koordinatör rotaları (tüm rotalar için önce token ve koordinatör yetkisi kontrolü)
router.use('/coordinator', verifyToken, isCoordinator);
router.get('/coordinator/all', companyController.getAllCompanies);
router.post('/coordinator/add', companyController.addCompany);
router.put('/coordinator/:id', companyController.updateCompany);
router.delete('/coordinator/:id', companyController.deleteCompany);
router.get('/coordinator/mentor-info', companyController.getCompanyMentorInfo); // YENİ ENDPOINT

// Öğrenci rotaları
router.use('/student', verifyToken, isStudent);
router.get('/student/available', companyController.getCompaniesForStudent);

module.exports = router;