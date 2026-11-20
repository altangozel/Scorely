const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MentorAssignment = sequelize.define('MentorAssignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  mentor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  placement_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assigned_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT
  },
  // Mentor değişim geçmişi için
  previous_mentor_id: {
    type: DataTypes.INTEGER
  },
  changed_date: {
    type: DataTypes.DATE
  },
  change_reason: {
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
  tableName: 'mentor_assignments',
  timestamps: false
});

module.exports = MentorAssignment;