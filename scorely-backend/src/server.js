const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Database bağlantısı
const sequelize = require('./config/database');
const { Role } = require('./models');

// Route'ları içeri aktar
const authRoutes = require('./routes/auth.routes');
const cvRoutes = require('./routes/cv.routes');
const coordinatorRoutes = require('./routes/coordinator.routes');
const programCodeRoutes = require('./routes/programCode.routes');
const internshipRoutes = require('./routes/internship.routes');
const userRoutes = require('./routes/user.routes');
const companyRoutes = require('./routes/company.routes');
const placementRoutes = require('./routes/placement.routes');
const employerRoutes = require('./routes/employer.routes');
const transcriptRoutes = require('./routes/transcript.routes');
const messageRoutes = require('./routes/message.routes'); // YENİ

const app = express();
const PORT = process.env.PORT || 5000;

// CORS yapılandırması
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosyaları servis et (dosya indirme gibi işlemler için)
// Personal uploads are not publicly served.

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Scorely API çalışıyor!' });
});

// Route'ları kullan
app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/program-codes', programCodeRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/messages', messageRoutes); // YENİ

// Global hata yakalama
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

// Veritabanı senkronizasyonu ve rollerin oluşturulması
const initDb = async () => {
  try {
    // Tabloları oluştur (force: true olursa tabloları siler ve yeniden oluşturur)
    await sequelize.sync({ force: false });
    console.log('Veritabanı tabloları senkronize edildi.');

    // Rolleri oluştur
    const roles = [
      { name: 'admin', description: 'Sistem yöneticisi' },
      { name: 'employer', description: 'İşveren/Şirket temsilcisi' },
      { name: 'university_coordinator', description: 'Üniversite koordinatörü' },
      { name: 'student', description: 'Öğrenci/İş arayan' }
    ];

    for (const role of roles) {
      const [createdRole, created] = await Role.findOrCreate({
        where: { name: role.name },
        defaults: role
      });
      
      if (created) {
        console.log(`${role.name} rolü oluşturuldu.`);
      }
    }
  } catch (error) {
    console.error('Veritabanı başlatma hatası:', error);
  }
};

// Server'ı başlat
app.listen(PORT, async () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
  console.log(`Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
  await initDb();
});