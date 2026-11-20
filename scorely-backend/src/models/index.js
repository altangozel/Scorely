const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Modelleri yükle
const Role = require('./Role');
const User = require('./User');
const CV = require('./CV');
const ProgramCode = require('./ProgramCode');
const InternshipApplication = require('./InternshipApplication');
const InternshipCompany = require('./InternshipCompany');
const InternshipPlacement = require('./InternshipPlacement')(sequelize, DataTypes);
const CompanyProfile = require('./CompanyProfile');
const Department = require('./Department');
const Mentor = require('./Mentor');
const MentorAssignment = require('./MentorAssignment');
const StudentTranscript = require('./StudentTranscript');
const CompanyVisit = require('./CompanyVisit');
const InternshipMessage = require('./InternshipMessage');

// İlişkileri tanımla
User.belongsTo(Role, { foreignKey: 'role_id' });
Role.hasMany(User, { foreignKey: 'role_id' });

// CV ilişkileri
User.hasMany(CV, { foreignKey: 'user_id' });
CV.belongsTo(User, { foreignKey: 'user_id' });

// Program kodu ilişkileri
User.hasMany(ProgramCode, { foreignKey: 'coordinator_id' });
ProgramCode.belongsTo(User, { foreignKey: 'coordinator_id', as: 'Coordinator' });

// Staj başvuru ilişkileri
User.hasMany(InternshipApplication, { foreignKey: 'user_id' });
InternshipApplication.belongsTo(User, { foreignKey: 'user_id' });

CV.hasMany(InternshipApplication, { foreignKey: 'cv_id' });
InternshipApplication.belongsTo(CV, { foreignKey: 'cv_id' });

ProgramCode.hasMany(InternshipApplication, { foreignKey: 'program_code', sourceKey: 'code' });
InternshipApplication.belongsTo(ProgramCode, { foreignKey: 'program_code', targetKey: 'code' });

// Staj şirketleri ilişkileri
InternshipCompany.belongsTo(User, { foreignKey: 'coordinator_id', as: 'Coordinator' });
InternshipCompany.belongsTo(ProgramCode, { foreignKey: 'program_code', targetKey: 'code' });

// Şirket profili ilişkileri
User.hasOne(CompanyProfile, { foreignKey: 'user_id' });
CompanyProfile.belongsTo(User, { foreignKey: 'user_id' });

// Departman ilişkileri
CompanyProfile.hasMany(Department, { foreignKey: 'company_id' });
Department.belongsTo(CompanyProfile, { foreignKey: 'company_id' });

// Mentor ilişkileri
CompanyProfile.hasMany(Mentor, { foreignKey: 'company_id' });
Mentor.belongsTo(CompanyProfile, { foreignKey: 'company_id' });
Department.hasMany(Mentor, { foreignKey: 'department_id' });
Mentor.belongsTo(Department, { foreignKey: 'department_id' });

// Mentor atama ilişkileri
Mentor.hasMany(MentorAssignment, { foreignKey: 'mentor_id' });
MentorAssignment.belongsTo(Mentor, { foreignKey: 'mentor_id' });
User.hasMany(MentorAssignment, { foreignKey: 'student_id', as: 'StudentAssignments' });
MentorAssignment.belongsTo(User, { foreignKey: 'student_id', as: 'Student' });
InternshipPlacement.hasMany(MentorAssignment, { foreignKey: 'placement_id' });
MentorAssignment.belongsTo(InternshipPlacement, { foreignKey: 'placement_id' });

// Transkript ilişkileri
User.hasMany(StudentTranscript, { foreignKey: 'student_id', as: 'Transcripts' });
StudentTranscript.belongsTo(User, { foreignKey: 'student_id', as: 'Student' });

// Şirket ziyaret ilişkileri
CompanyProfile.hasMany(CompanyVisit, { foreignKey: 'company_id' });
CompanyVisit.belongsTo(CompanyProfile, { foreignKey: 'company_id' });
User.hasMany(CompanyVisit, { foreignKey: 'coordinator_id', as: 'CoordinatorVisits' });
CompanyVisit.belongsTo(User, { foreignKey: 'coordinator_id', as: 'Coordinator' });

// Mesaj ilişkileri
User.hasMany(InternshipMessage, { foreignKey: 'sender_id', as: 'SentMessages' });
User.hasMany(InternshipMessage, { foreignKey: 'receiver_id', as: 'ReceivedMessages' });
InternshipMessage.belongsTo(User, { foreignKey: 'sender_id', as: 'Sender' });
InternshipMessage.belongsTo(User, { foreignKey: 'receiver_id', as: 'Receiver' });
InternshipPlacement.hasMany(InternshipMessage, { foreignKey: 'placement_id' });
InternshipMessage.belongsTo(InternshipPlacement, { foreignKey: 'placement_id' });

// İlişkileri modellerin associate fonksiyonlarını çağırarak tanımla
const models = {
  Role,
  User,
  CV,
  ProgramCode,
  InternshipApplication,
  InternshipCompany,
  InternshipPlacement,
  CompanyProfile,
  Department,
  Mentor,
  MentorAssignment,
  StudentTranscript,
  CompanyVisit,
  InternshipMessage
};

// InternshipPlacement için associate metodu çağır
if (InternshipPlacement.associate) {
  InternshipPlacement.associate(models);
}

// Modelleri dışa aktar
module.exports = {
  sequelize,
  Role,
  User,
  CV,
  ProgramCode,
  InternshipApplication,
  InternshipCompany,
  InternshipPlacement,
  CompanyProfile,
  Department,
  Mentor,
  MentorAssignment,
  StudentTranscript,
  CompanyVisit,
  InternshipMessage
};