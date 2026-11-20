const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  const token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    return res.status(403).send({
      message: 'Token sağlanmadı!'
    });
  }

  // Token "Bearer " ile başlıyorsa, bu kısmı kaldır
  const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;

  try {
    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send({
      message: 'Yetkisiz!'
    });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).send({
      message: 'Bu işlem için admin yetkisi gerekiyor!'
    });
  }
};

const isEmployer = (req, res, next) => {
  if (req.user && (req.user.role === 'employer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).send({
      message: 'Bu işlem için işveren yetkisi gerekiyor!'
    });
  }
};

const isCoordinator = (req, res, next) => {
  if (req.user && (req.user.role === 'university_coordinator' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).send({
      message: 'Bu işlem için koordinatör yetkisi gerekiyor!'
    });
  }
};

const isStudent = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).send({
      message: 'Bu işlem için öğrenci yetkisi gerekiyor!'
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isEmployer,
  isCoordinator,
  isStudent
};