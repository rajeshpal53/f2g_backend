const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("../models/user");
const Status = require("../models/status");
const LoanType = require("../models/loanType");

const booking = sequelize.define("bookings", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  usersfk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  bookedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "id",
    },
  },
  bookingAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  tentativeBillAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  loanAccountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bankOrNBFCName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  loantypefk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: LoanType,
      key: 'id',
    },
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bookId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  statusfk: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Status,
      key: 'id',
    },
  },
});

module.exports = booking;
