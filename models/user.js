const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  mobile: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  whatsappnumber: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: [10, 10], // Ensure it's exactly 10 digits
      isNumeric: true, // Ensure only numeric values
    },
  },
  aadharCard: {
    type: DataTypes.STRING(12),
    allowNull: true,
    validate: {
      len: [12, 12], // Ensure it's exactly 12 digits
      isNumeric: true, // Ensure only numeric values
    },
  },
  aadharCardFronturl: {
    type: DataTypes.STRING,  
    allowNull: true
  },
  aadharCardBackurl: {
    type: DataTypes.STRING,  
    allowNull: true
  },
  profilePicurl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  dob: {
    type: DataTypes.STRING,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
  },
  address: {
    type: DataTypes.STRING,
  },
  pincode: {
    type: DataTypes.INTEGER,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token_validity: {
    type: DataTypes.DATE, 
    allowNull: true,
    defaultValue: null, 
  },
  latitude: {
    type: DataTypes.DECIMAL(9, 6),
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
  },
  fcmtokens: {
    type: DataTypes.JSON,
  },
  roles: {
    type: DataTypes.ENUM('user', 'admin'),
    allowNull: true,
  }
});

module.exports = User;
