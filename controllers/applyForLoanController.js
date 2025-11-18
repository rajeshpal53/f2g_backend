const ApplyForLoan = require('../models/applyForLoan');
const LoanType = require('../models/loanType');
const utility = require('../utility/utility');

// Create a feedBack
exports.createApplyForLoan = async (req, res) => {
    try {
      const {body} = req;
    
      const applyForLoan1 = await ApplyForLoan.create(body);

      const applyForLoan = await ApplyForLoan.findOne({
        where: {
            id : applyForLoan1.id
        },
        include: [
            { model: LoanType, as: 'loantype'}
        ]
      })
      
      utility.sendApplyForLoanMailToAdmin(applyForLoan);

      return res.status(201).json(applyForLoan1);
    } catch (error) {
        console.log("error is:- ", error);
        return res.status(400).json({ error: error.message });
    }
  };
  
  // Get all feedBack
  exports.getAllApplyForLoan = async (req, res) => {
    try {
      let { page, limit } = req.query;
  
      // Convert query params to integers and set defaults
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10; // Default limit is 10
  
      const offset = (page - 1) * limit;
  
      const { count, rows: applyForLoan } = await ApplyForLoan.findAndCountAll({
        limit,
        offset
      });
  
      return res.status(200).json({
        totalFeedback: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        feedback: applyForLoan
      });
    } catch (error) {
      console.log("Error is: ", error);
      return res.status(400).json({ error: error.message });
    }
  };
  
  // Get a feedBack By Id
  exports.getApplyForLoanById = async (req, res) => {
    try {
      const applyForLoan = await ApplyForLoan.findByPk(req.params.id);
      if (!applyForLoan) {
        return res.status(404).json({ error: 'applyForLoan not found' });
      }
      return res.status(200).json(applyForLoan);
    } catch (error) {
        console.log("error is:- ", error);
        return res.status(400).json({ error: error.message });
    }
  };
  
  // Update a feedback
  exports.updateApplyForLoan = async (req, res) => {
    try {
        const {...body } = req.body;
        // Find the feedback by primary key
        const applyForLoan = await ApplyForLoan.findByPk(req.params.id);
        if (!applyForLoan) {
          return res.status(404).json({ message: 'applyForLoan not found' });
        }

        // Create updated data object
        const updatedData = {
          ...body,
        };  
        await applyForLoan.update(updatedData); 
        return res.status(200).json(applyForLoan);
    } catch (error) {
        console.log("error is:- ", error);  
        return res.status(400).json({ error: error.message });
    }
  };
  
  // Delete a feedback
  exports.deleteApplyForLoan = async (req, res) => {
    try {
        const applyForLoan = await ApplyForLoan.findByPk(req.params.id);
        if (!applyForLoan) {
          return res.status(404).json({ message: 'applyForLoan not found' });
        }

        await applyForLoan.destroy();

        return res.status(200).json({ message: 'applyForLoan deleted successfully' });
    } catch (error) {
    console.log("error is:- ", error);
    return res.status(400).json({ error: error.message });
    }
  };