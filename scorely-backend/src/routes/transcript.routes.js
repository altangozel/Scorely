const express = require('express');
const router = express.Router();
const transcriptController = require('../controllers/transcript.controller');
const { verifyToken, isStudent, isEmployer, isCoordinator } = require('../middleware/auth.middleware');
const { uploadTranscript } = require('../utils/uploadHelper');

// Öğrenci rotaları
router.post('/upload', verifyToken, isStudent, uploadTranscript.single('transcript'), transcriptController.uploadTranscript);
router.get('/my-transcripts', verifyToken, isStudent, transcriptController.getStudentTranscripts);

// Genel rotalar (öğrenci, işveren, koordinatör erişebilir)
router.get('/student/:studentId', verifyToken, transcriptController.getStudentTranscripts);
router.get('/download/:id', verifyToken, transcriptController.downloadTranscript);

// Koordinatör rotaları
router.put('/verify/:id', verifyToken, isCoordinator, transcriptController.verifyTranscript);

module.exports = router;