const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("../models/user");
const LoanType = require("../models/loanType");
const Status = require("../models/status");

const refferal = sequelize.define("refferals", {
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
  refferedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "id",
    },
  },
  loanAmount: {
    type: DataTypes.DECIMAL(12, 2),
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
  refId: {
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

module.exports = refferal;
