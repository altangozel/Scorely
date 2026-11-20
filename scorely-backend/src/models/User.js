const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  tckn: {
    type: DataTypes.STRING(11),
    unique: true
  },
  phone_number: {
    type: DataTypes.STRING(15)
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_method: {
    type: DataTypes.STRING(20)
  },
  role_id: {
    type: DataTypes.INTEGER
  },
  linkedin_id: {
    type: DataTypes.STRING(100)
  },
  application_id: {
    type: DataTypes.STRING(50),
    unique: true
  },
  form_id: {
    type: DataTypes.STRING(50),
    unique: true
  },
  gpa: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: 0,
      max: 4.0
    }
  },
  approved_program_code: {
    type: DataTypes.STRING(50),
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
  tableName: 'users',
  timestamps: false
});

module.exports = User;