const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 

const FeedBack = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  feedbackType: {
    type: DataTypes.ENUM('Complaint', 'Questions', 'Suggestion', 'Comment', 'Feature Request', 'Bug Report', 'Others'),
    allowNull: false,
  },
  isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Initially, feedback is not resolved
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  screenShotUrl: {
      type: DataTypes.STRING,
      allowNull: true,
  },
});

module.exports = FeedBack;
    
    
