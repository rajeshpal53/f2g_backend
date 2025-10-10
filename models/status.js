const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Status = sequelize.define('Statuses', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  status: {
    type: DataTypes.ENUM('login incomplete', 'login done', 'post paid doc', 'reject', 'l and t stage', 'sub approved', 'approved', 'disbursed', 'otc/pdd pending', 'billing in process', 'billing cleared'),
    allowNull: false,
  },
});

module.exports = Status;
