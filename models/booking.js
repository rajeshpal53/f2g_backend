const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("../models/user");

const booking = sequelize.define("bookings", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
    allowNull: false,
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
  loanType: {
    type: DataTypes.ENUM('1', '2'),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  bookId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = booking;
