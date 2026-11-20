module.exports = (sequelize, DataTypes) => {
    const InternshipPlacement = sequelize.define('InternshipPlacement', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      application_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'internship_applications',
          key: 'id'
        }
      },
      company_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'internship_companies',
          key: 'id'
        }
      },
      preference_order: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      placement_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'not_placed'
      },
      company_approval_status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: true,
        defaultValue: null
      },
      company_approval_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      company_approval_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_visible_to_student: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      tableName: 'internship_placements',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
    
    InternshipPlacement.associate = function(models) {
      InternshipPlacement.belongsTo(models.InternshipApplication, {
        foreignKey: 'application_id'
      });
      InternshipPlacement.belongsTo(models.InternshipCompany, {
        foreignKey: 'company_id'
      });
    };
    
    return InternshipPlacement;
  };