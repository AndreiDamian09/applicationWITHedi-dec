const sequelize = require("../config/database");
const UserModel = require("./User");
const RegistrationSessionModel = require("./RegistrationSession");
const DissertationRequestModel = require("./DissertationRequest");

/**
 * Initialize all models and set up associations
 */
const User = UserModel(sequelize);
const RegistrationSession = RegistrationSessionModel(sequelize);
const DissertationRequest = DissertationRequestModel(sequelize);

// Associations
User.hasMany(RegistrationSession, {
  foreignKey: "professorId",
  as: "sessions",
});
RegistrationSession.belongsTo(User, {
  foreignKey: "professorId",
  as: "professor",
});

RegistrationSession.hasMany(DissertationRequest, {
  foreignKey: "sessionId",
  as: "requests",
});
DissertationRequest.belongsTo(RegistrationSession, {
  foreignKey: "sessionId",
  as: "session",
});

User.hasMany(DissertationRequest, {
  foreignKey: "studentId",
  as: "studentRequests",
});
DissertationRequest.belongsTo(User, {
  foreignKey: "studentId",
  as: "student",
});

User.hasMany(DissertationRequest, {
  foreignKey: "professorId",
  as: "receivedRequests",
});
DissertationRequest.belongsTo(User, {
  foreignKey: "professorId",
  as: "professor",
});

module.exports = {
  sequelize,
  User,
  RegistrationSession,
  DissertationRequest,
};
