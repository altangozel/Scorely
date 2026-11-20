const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyVisit = sequelize.define('CompanyVisit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  company_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  coordinator_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  visit_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  visit_type: {
    type: DataTypes.ENUM('physical', 'online', 'phone'),
    defaultValue: 'physical'
  },
  purpose: {
    type: DataTypes.TEXT
  },
  attendees: {
    type: DataTypes.TEXT
  },
  notes: {
    type: DataTypes.TEXT
  },
  follow_up_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  follow_up_date: {
    type: DataTypes.DATE
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
  tableName: 'company_visits',
  timestamps: false
});

module.exports = CompanyVisit;