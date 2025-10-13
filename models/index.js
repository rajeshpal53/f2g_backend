const sequelize = require('../config/database');
const User = require('./user');
const Status = require('./status');
const Refferal = require('./refferal');
const Booking = require('./booking');
const feedBack = require('./feedBack');
const FeedBack = require('./feedBack');
const LoanType = require('./loanType');

const models = {
  User,
  feedBack,
  Refferal,
  Booking,
  Status,
  LoanType
};

User.hasMany(Booking, {foreignKey: 'usersfk', as: 'bookings'});
User.hasMany(Refferal, {foreignKey: 'usersfk', as: 'refferals'});

Booking.belongsTo(User, {foreignKey: 'usersfk', as: 'user'});
Booking.belongsTo(Status, {foreignKey: 'statusfk', as: 'status'});
Booking.belongsTo(LoanType, {foreignKey: 'loantypefk', as: 'loantype'});
Booking.belongsTo(User, { foreignKey: 'bookedBy', as: 'bookedByUser' });

Refferal.hasMany(Status, {foreignKey: 'statusfk', as: 'status'});
Refferal.belongsTo(User, {foreignKey: 'usersfk', as: 'user'});
Refferal.belongsTo(LoanType, {foreignKey: 'loantypefk', as: 'loantype'});
Refferal.belongsTo(User, {foreignKey: 'refferedBy', as: 'refferedByUser'});

sequelize.sync()
  // .sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch((error) => console.error('Error syncing database:', error));

module.exports = models;
