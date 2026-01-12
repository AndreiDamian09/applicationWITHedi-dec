const { DataTypes } = require("sequelize");

/**
 * DissertationRequest Model
 * Represents a student's request to a professor for dissertation coordination
 * Status workflow: pending -> approved/rejected
 * If approved, student can upload files; if rejected, student can create new request
 */
module.exports = (sequelize) => {
  const DissertationRequest = sequelize.define(
    "DissertationRequest",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "registration_sessions",
          key: "id",
        },
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      professorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      preliminaryRequestFile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      signedCoordinationRequestFile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      professorReviewFile: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dissertationTitle: {
        type: DataTypes.STRING,
        allowNull: true,
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
      tableName: "dissertation_requests",
      timestamps: true,
    }
  );

  return DissertationRequest;
};
