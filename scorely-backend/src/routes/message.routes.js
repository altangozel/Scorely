// routes/message.routes.js
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const { verifyToken, isCoordinator } = require('../middleware/auth.middleware');

// Tüm rotalar için token kontrolü
router.use(verifyToken);

// Koordinatör rotaları
router.get('/coordinator/mentors', isCoordinator, messageController.getAvailableMentorsForCoordinator);
router.post('/coordinator/send', isCoordinator, messageController.sendMessageFromCoordinator);
router.get('/coordinator/list', isCoordinator, messageController.getMessagesForCoordinator);
router.put('/coordinator/read/:id', isCoordinator, messageController.markMessageAsRead);

module.exports = router;