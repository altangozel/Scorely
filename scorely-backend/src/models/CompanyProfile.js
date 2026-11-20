const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyProfile = sequelize.define('CompanyProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tax_number: {
    type: DataTypes.STRING(20),
    unique: true
  },
  address: {
    type: DataTypes.TEXT
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  website: {
    type: DataTypes.STRING(255)
  },
  sector: {
    type: DataTypes.STRING(100)
  },
  employee_count: {
    type: DataTypes.INTEGER
  },
  description: {
    type: DataTypes.TEXT
  },
  logo_url: {
    type: DataTypes.STRING(255)
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
  tableName: 'company_profiles',
  timestamps: false
});

module.exports = CompanyProfile;