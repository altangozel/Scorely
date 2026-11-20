const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CV = sequelize.define('CV', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
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
  is_encrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  content_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  extracted_skills: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('extracted_skills');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('extracted_skills', JSON.stringify(value));
    }
  },
  estimated_experience_years: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  education_level: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  education_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  language_skills: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('language_skills');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('language_skills', JSON.stringify(value));
    }
  },
  total_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  skill_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  experience_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  language_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Koordinatör için yeni alanlar
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('tags');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('tags', JSON.stringify(value));
    }
  },
  coordinator_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_processed_at: {
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
  tableName: 'cvs',
  timestamps: false
});

module.exports = CV;