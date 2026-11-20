const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentTranscript = sequelize.define('StudentTranscript', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  original_filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  gpa: {
    type: DataTypes.FLOAT
  },
  upload_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  verified_by_coordinator: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_date: {
    type: DataTypes.DATE
  },
  verification_notes: {
    type: DataTypes.TEXT
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'student_transcripts',
  timestamps: false
});

module.exports = StudentTranscript;