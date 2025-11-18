const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const LoanType = require("../models/loanType");

const ApplyForLoan = sequelize.define('ApplyForLoan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  loanAmount: {
    type: DataTypes.STRING,
  },
  loantypefk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: LoanType,
      key: 'id',
    },
  },
});

module.exports = ApplyForLoan;
