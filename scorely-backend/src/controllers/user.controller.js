// controllers/user.controller.js
const { User, Role } = require('../models');

// Öğrenci GPA'sını güncelleme
exports.updateStudentGPA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gpa } = req.body;
    
    if (gpa === undefined || isNaN(gpa) || gpa < 0 || gpa > 4.0) {
      return res.status(400).json({ message: 'Geçerli bir GPA giriniz (0-4.0 arası).' });
    }
    
    await User.update(
      { gpa },
      { where: { id: userId } }
    );
    
    res.status(200).json({
      message: 'GPA başarıyla güncellendi.',
      gpa
    });
  } catch (error) {
    console.error('GPA güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Koordinatör tarafından öğrenci GPA'sını güncelleme
exports.updateStudentGPAByCoordinator = async (req, res) => {
  try {
    const { userId } = req.params;
    const { gpa } = req.body;
    
    if (gpa === undefined || isNaN(gpa) || gpa < 0 || gpa > 4.0) {
      return res.status(400).json({ message: 'Geçerli bir GPA giriniz (0-4.0 arası).' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    
    await user.update({ gpa });
    
    res.status(200).json({
      message: 'Öğrenci GPA\'sı başarıyla güncellendi.',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        gpa: user.gpa
      }
    });
  } catch (error) {
    console.error('GPA güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};