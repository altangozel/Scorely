const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InternshipMessage = sequelize.define('InternshipMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sender_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  receiver_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  placement_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  message_type: {
    type: DataTypes.ENUM('general', 'approval', 'rejection', 'info', 'warning'),
    defaultValue: 'general'
  },
  subject: {
    type: DataTypes.STRING(255)
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_date: {
    type: DataTypes.DATE
  },
  parent_message_id: {
    type: DataTypes.INTEGER // Mesaj zincirleme için
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'internship_messages',
  timestamps: false
});

module.exports = InternshipMessage;