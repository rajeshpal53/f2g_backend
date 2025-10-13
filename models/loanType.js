const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoanType = sequelize.define('LoanType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('home', 'personal', 'property', 'car', 'business', 'cvLoan', 'auto', 'other'),
    allowNull: false,
  },
});

module.exports = LoanType;
