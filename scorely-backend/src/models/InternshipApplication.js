// models/InternshipApplication.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InternshipApplication = sequelize.define('InternshipApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cv_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  program_code: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  // Koordinatör onay durumu
  coordinator_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  coordinator_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coordinator_reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Şirket onay durumu
  company_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  company_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  company_reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
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
  tableName: 'internship_applications',
  timestamps: false
});

module.exports = InternshipApplication;