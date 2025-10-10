const FeedBack = require('../models/feedBack');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const utility = require('../utility/utility');

// Create a feedBack
exports.createFeedBack = async (req, res) => {
    try {
        const {body} = req;
        const screenShotUrl = req.savedFiles?.screenShotUrl || null;

        const feedBackData = {
          ...body,
          screenShotUrl,
        };
    
      const feedBack = await FeedBack.create(feedBackData);

      if (feedBack.feedbackType !== "Comment") {
        // utility.sendAdminFeedBackMail(feedBack);
      }

      return res.status(201).json(feedBack);
    } catch (error) {
        console.log("error is:- ", error);
        return res.status(400).json({ error: error.message });
    }
  };
  
  // Get all feedBack
  exports.getAllFeedBack = async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      // Convert query params to integers and set defaults
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10; // Default limit is 10
  
      const offset = (page - 1) * limit;
  
      const { count, rows: feedBack } = await FeedBack.findAndCountAll({
        limit,
        offset
      });
  
      return res.status(200).json({
        totalFeedback: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        feedback: feedBack
      });
    } catch (error) {
      console.log("Error is: ", error);
      return res.status(400).json({ error: error.message });
    }
  };
  
  exports.getAllResolvedByPagination = async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      // Set default values if not provided
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      const offset = (page - 1) * limit;
  
      // Fetch feedback with pagination
      const { count, rows } = await FeedBack.findAndCountAll({
        where: { isResolved: true },
        limit,
        offset,
        order: [
          ['updatedAt', 'DESC'], // Primary sort by updatedAt in descending order
          ['createdAt', 'DESC'], // Secondary sort by createdAt in descending order
        ],  
      });
  
      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
      });
    } catch (error) {
      console.log("Error is:", error);
      return res.status(400).json({ error: error.message });
    }
  };
  
  exports.getAllUnResolvedByPagination = async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      // Set default values if not provided
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      const offset = (page - 1) * limit;
  
      // Fetch feedback with pagination
      const { count, rows } = await FeedBack.findAndCountAll({
        where: { isResolved: false },
        limit,
        offset,
        order: [
          ['updatedAt', 'DESC'], // Primary sort by updatedAt in descending order
          ['createdAt', 'DESC'], // Secondary sort by createdAt in descending order
        ],  
      });
  
      return res.status(200).json({
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        data: rows,
      });
    } catch (error) {
      console.log("Error is:", error);
      return res.status(400).json({ error: error.message });
    }
  };
  
  // Get a feedBack By Id
  exports.getFeedBackById = async (req, res) => {
    try {
      const feedBack = await FeedBack.findByPk(req.params.id);
      if (!feedBack) {
        return res.status(404).json({ error: 'feedback not found' });
      }
      return res.status(200).json(feedBack);
    } catch (error) {
        console.log("error is:- ", error);
        return res.status(400).json({ error: error.message });
    }
  };
  
  // Update a feedback
  exports.updateFeedback = async (req, res) => {
    try {
        const { name, ...body } = req.body;
        const feedBackId = req.params.id;
        // Find the feedback by primary key
        const feedBack = await FeedBack.findByPk(feedBackId);
        if (!feedBack) {
          return res.status(404).json({ message: 'FeedBack not found' });
        }
    
        // Check if an image was uploaded and processed
        if (feedBack.screenShotUrl) {
        if (req.savedFiles?.screenShotUrl) {
          const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../f2g/assets');
          
          // Construct the full path to the old file
          const oldImagePath = path.join(baseUploadPath, feedBack.screenShotUrl.replace('assets/', ''));    
          console.log("oldPath: ", oldImagePath);
    
          //  if (feedBack.screenShotUrl) {
            try {
              await fs.promises.access(oldImagePath);
              await fs.promises.unlink(oldImagePath);
            } catch (err) {
              console.error('Error deleting old image:', err.message);
            }
          
          }
        }
    
        const screenShotUrl = req.savedFiles?.screenShotUrl || feedBack.screenShotUrl;
    
        // Create updated data object
        const updatedData = {
          ...body,
          name,
          screenShotUrl
        };

        await feedBack.update(updatedData);

        return res.status(200).json(feedBack);
    } catch (error) {
        console.log("error is:- ", error);  
        return res.status(400).json({ error: error.message });
    }
  };
  
  // Delete a feedback
  exports.deleteFeedback = async (req, res) => {
    try {
        const feedBack = await FeedBack.findByPk(req.params.id);
        if (!feedBack) {
          return res.status(404).json({ message: 'feedBack not found' });
        }
    
        if(feedBack.screenShotUrl){
          const baseUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../f2g/assets');
            
          // Construct the full path to the old file
          const oldImagePath = path.join(baseUploadPath, feedBack.screenShotUrl.replace('assets/', ''));    
          console.log("oldPath: ", oldImagePath);
            try {
              await fs.promises.access(oldImagePath);
              await fs.promises.unlink(oldImagePath);
            } catch (err) {
              console.error('Error deleting old image:', err.message);
            }  
        }

        await feedBack.destroy();

        return res.status(200).json({ message: 'feedback deleted successfully' });
    } catch (error) {
    console.log("error is:- ", error);
    return res.status(400).json({ error: error.message });
    }
  };