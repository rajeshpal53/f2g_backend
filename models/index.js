const sequelize = require('../config/database');
const User = require('./user');
const Status = require('./status');

const models = {
  User,
};


sequelize.sync()
  // .sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch((error) => console.error('Error syncing database:', error));

module.exports = models;
