const { DataTypes } = require("sequelize");

/**
 * RegistrationSession Model
 * Represents a time period during which a professor accepts dissertation requests
 * Sessions cannot overlap for the same professor
 */
module.exports = (sequelize) => {
  const RegistrationSession = sequelize.define(
    "RegistrationSession",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      professorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      maxStudents: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "registration_sessions",
      timestamps: true,
    }
  );

  return RegistrationSession;
};
