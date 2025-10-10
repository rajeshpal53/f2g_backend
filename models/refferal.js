const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("../models/user");

const refferal = sequelize.define("refferals", {
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
  refferedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  loanAmount: {
    type: DataTypes.DECIMAL(12, 2),
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
  refId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = refferal;
