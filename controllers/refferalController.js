const Refferal = require('../models/refferal');
const sequelize = require('../config/database');
const userController = require('./userController');
const User = require("../models/user");
const Status = require('../models/status');
const LoanType = require('../models/loanType');
const { Op, Sequelize } = require("sequelize");
const moment = require('moment');

// create booking
exports.createRefferal = async (req, res) => {
  const {
    name,
    refferedBy,
    loanAmount,
    loantypefk,
    mobile,
    address,
    remark,
    refId,
    statusfk
  } = req.body;

  const transaction = await sequelize.transaction(); // Start a transaction

  try {
    // Validate input
    if (!statusfk || !address || !name || !mobile || !loantypefk) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let user = await User.findOne({where: { mobile }});
    if(!user) {
      const password = "user@123";
      user = await userController.upsertOnlyUser(mobile, name, address, password, transaction);
    }

    const date = new Date();
    const formattedDate = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;

    // Create Invoice
    const refferal = await Refferal.create(
      {
        name,
        usersfk: user.id,
        refferedBy,
        loanAmount,
        loantypefk,
        address,
        remark,
        refId : `ref-${formattedDate}-${user.id}`,
        statusfk
      },
      { transaction }
    );
    
    await transaction.commit(); // Commit the transaction

    res.status(201).json(refferal);
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error("error is:-", error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
  
  // Update a feedback
  exports.updateRefferal = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;

        // Find the feedback by primary key
        const refferal = await Refferal.findByPk(id);
        if (!refferal) {
          return res.status(404).json({ message: 'refferal not found' });
        }
        
        await refferal.update(body);

         return res.status(200).json({
          success: true,
          message: 'refferal updated successfully',
          data: refferal
        });
    } catch (error) {
        console.log("error is:- ", error);  
        return res.status(400).json({ error: error.message });
    }
  };

exports.getRefferal = async (req, res) => {
  try {
    let { dateRange, statusfk, startDate, endDate, year, month, week, calenderView, sort, sortField, searchTerm, id, usersfk, refferedBy, loantypefk, page, limit } = req.query;
    let whereClause = {};

     // let sortFields = sortField;
    let sortDirection = 'ASC';
    let orderCondition = [];

    if (sort) {
      sortDirection = sort.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    }

    if( sortField == 'createdAt'){
      orderCondition.push( ['createdAt', sortDirection]);
    } else if( sortField == 'updatedAt'){
      orderCondition.push( ['updatedAt', sortDirection]);
    }

    // Handle predefined date ranges
    if (dateRange) {
      let fromDate;
      const today = moment().endOf('day');

      switch (dateRange) {
        case '1month':
          fromDate = moment().subtract(1, 'months').startOf('day');
          break;
        case '3months':
          fromDate = moment().subtract(3, 'months').startOf('day');
          break;
        case '6months':
          fromDate = moment().subtract(6, 'months').startOf('day');
          break;
        default:
          return res.status(400).json({ message: 'Invalid date range' });
      }

      whereClause.createdAt = { [Op.between]: [fromDate.toDate(), today.toDate()] };
    } else if (startDate && endDate) {
      const start = moment(startDate, "DD-MM-YYYY").startOf('day');
      const end = moment(endDate, "DD-MM-YYYY").endOf('day');

      if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({ success: false, message: "Invalid date format. Use DD-MM-YYYY." });
      }

      whereClause.createdAt = {
        [Op.between]: [start.toDate(), end.toDate()]
      };
    } else if (month && year) {
      const paddedMonth = month.toString().padStart(2, '0');
      const startOfMonth = moment(`${year}-${paddedMonth}-01`).startOf('month').toDate();
      const endOfMonth = moment(`${year}-${paddedMonth}-01`).endOf('month').toDate();

      whereClause.createdAt = {
        [Op.between]: [startOfMonth, endOfMonth]
        };
    } else if (year) {
      const startOfYear = moment(`${year}-01-01`).startOf('year').toDate();
      const endOfYear = moment(`${year}-12-31`).endOf('year').toDate();

      whereClause.createdAt = {
          [Op.between]: [startOfYear, endOfYear]
        };
    } else if (month) {
      const paddedMonth = month.toString().padStart(2, '0');
      const currentYear = new Date().getFullYear();
      const startOfMonth = moment(`${currentYear}-${paddedMonth}-01`).startOf('month').toDate();
      const endOfMonth = moment(`${currentYear}-${paddedMonth}-01`).endOf('month').toDate();

      whereClause.createdAt = {
          [Op.between]: [startOfMonth, endOfMonth]
        };
    } else if (week) {
      const startOfWeek = moment().week(week).startOf('week').toDate();
      const endOfWeek = moment().week(week).endOf('week').toDate();

      whereClause.createdAt = {
          [Op.between]: [startOfWeek, endOfWeek]
        };
    } else if (calenderView) {
      let fromDate, toDate;

      switch (calenderView) {
        case 'week':
          fromDate = moment().startOf('week').toDate();
          toDate = moment().endOf('week').toDate();
          break;
        case 'month':
          fromDate = moment().startOf('month').toDate();
          toDate = moment().endOf('month').toDate();
          break;
        case 'year':
          fromDate = moment().startOf('year').toDate();
          toDate = moment().endOf('year').toDate();
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid date range' });
      }

      whereClause.createdAt = {
          [Op.between]: [fromDate, toDate]
        };
    }

    // Filter by statusfk if provided
    if (statusfk) {
      whereClause.statusfk = statusfk;
    }

    if (loantypefk) {
      whereClause.loantypefk = loantypefk;
    }

    if(id){
      whereClause.id = id;
    }

    if(usersfk){
      whereClause.usersfk = usersfk;
    }

    if(refferedBy){
      whereClause.refferedBy = refferedBy;
    }

    // Try to parse the search term as a date (assuming YYYY-MM-DD format)
    let dateSearch = null;
    if (moment(searchTerm, "DD-MM-YYYY", true).isValid()) {
      dateSearch = moment(searchTerm, "DD-MM-YYYY").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        // Adjust the fields to search based on your model
        { loanAmount: { [Op.like]: `%${searchTerm}%` } },
        { refId: { [Op.like]: `%${searchTerm}%` } },
        { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.email$": { [Op.like]: `%${searchTerm}%` } },
        { "$status.status$": { [Op.like]: `%${searchTerm}%` } },
        { "$loantype.type$": { [Op.like]: `%${searchTerm}%` } },
        { "$refferedByUser.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$refferedByUser.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$refferedByUser.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$refferedByUser.email$": { [Op.like]: `%${searchTerm}%` } },
        ...(dateSearch
          ? [{ createdAt: { [Op.between]: [dateSearch, moment(dateSearch).endOf("day").toDate()] } }]
          : []),
      ];
    }

     // Pagination setup
     const pageNumber = parseInt(page) || 1; // Default to page 1
     const pageSize = parseInt(limit) || 10; // Default to 10 invoices per page
     const offset = (pageNumber - 1) * pageSize;

    // Fetch invoices with pagination
    const { count, rows: refferals } = await Refferal.findAndCountAll({
      where: {
        ...whereClause,
      },
      include:[
        {model: Status, as: 'status'},
        {model : User, as : 'user'},
        {model : User , as : 'refferedByUser'},
        {model : LoanType , as : 'loantype'}
      ],
      order: orderCondition,
      //distinct: true,
      limit: pageSize,
      offset: offset,
      // subQuery: false
    });

    return res.status(200).json({
      success: true,
      totalRefferals: count, // Total invoices found
      totalPages: Math.ceil(count / limit), // Total pages
      currentPage: page,
      refferals
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRefferalStats = async (req, res) => {
  try {
    const { dateRange, startDate, endDate, year, month, refferedBy, usersfk } = req.query;

    // Base where clause
    let whereClause = {};
    
    if(refferedBy){
      whereClause.refferedBy = refferedBy;
    }

    if(usersfk){
      whereClause.usersfk = usersfk;
    }

    const today = moment().endOf('day');

    if (startDate && endDate) {
      // Custom range
      const start = moment(startDate, "DD-MM-YYYY").startOf('day');
      const end = moment(endDate, "DD-MM-YYYY").endOf('day');

      if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({ success: false, message: "Invalid date format. Use DD-MM-YYYY." });
      }

      whereClause.createdAt = {
        [Op.between]: [start.toDate(), end.toDate()]
      };
    } else if (year && month) {
      const start = moment(`${year}-${month}-01`, "YYYY-MM-DD").startOf('month');
      const end = start.clone().endOf('month');

      if (!start.isValid()) {
        return res.status(400).json({ success: false, message: "Invalid year or month." });
      }

      whereClause.createdAt = {
        [Op.between]: [start.toDate(), end.toDate()]
      };

    // 3. Year only
    } else if (year) {
      const start = moment(`${year}-01-01`, "YYYY-MM-DD").startOf('year');
      const end = start.clone().endOf('year');

      whereClause.createdAt = {
        [Op.between]: [start.toDate(), end.toDate()]
      };

    // 4. Predefined Ranges
    } else if (dateRange) {
      let fromDate;

      switch (dateRange) {
        case 'week':
          fromDate = moment().startOf('week').toDate();
          break;
        case 'month':
          fromDate = moment().startOf('month').toDate();
          break;
        case 'year':
          fromDate = moment().startOf('year').toDate();
          break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid date range' });
      }

      whereClause.createdAt = {
        [Op.between]: [fromDate, today.toDate()]
      };
    }

    const { count, rows: refferal } = await Refferal.findAndCountAll({
      where: whereClause,
      //distinct: true, 
      include: [
        {model: Status, as: 'status'},
        {model : User, as : 'user'},
        {model : User , as : 'refferedByUser'},
        {model : LoanType , as : 'loantype'}
      ]
    });    

     // If no bookings, return zero stats
    if (count === 0) {
     return res.status(200).json({
       success: true,
       noOfRefferals: 0,
       statusWiseRefferals: {},
       loanTypeWiseRefferals: {}
     });
    }
  
    // --- STATUS-WISE COUNTS ---
    const statusWiseRefferals = await Refferal.findAll({
      where: whereClause,
      attributes: [
        "statusfk",
        [Sequelize.fn("COUNT", Sequelize.col("refferals.statusfk")), "count"],
      ],
      include: [{ model: Status, as: "status", attributes: ["status"] }],
      group: ["refferals.statusfk", "status.status"],
      raw: true,
    });

    const statusStats = {};
    statusWiseRefferals.forEach((s) => {
      statusStats[s["status.status"]] = parseInt(s.count, 10);
    });

    // --- loan type-WISE COUNTS ---
    const loanTypeWiseRefferals = await Refferal.findAll({
      where: whereClause,
      attributes: [
        "loantypefk",
        [Sequelize.fn("COUNT", Sequelize.col("refferals.loantypefk")), "count"],
      ],
      include: [{model : LoanType , as : 'loantype', attributes: ["type"] }],
      group: ["refferals.loantypefk", "loantype.type"],
      raw: true,
    });

    const loanTypeStats = {};
    loanTypeWiseRefferals.forEach((s) => {
      loanTypeStats[s["loantype.type"]] = parseInt(s.count, 10);
    });

    let monthlyRefferals = [];

    if (year && !month && !startDate && !endDate && !dateRange) {
      for (let m = 0; m < 12; m++) {
        const start = moment(`${year}-${m + 1}-01`, "YYYY-MM-DD").startOf('month');
        const end = start.clone().endOf('month');
      
        const refferals = await Refferal.count({
          where: {
            createdAt: {
              [Op.between]: [start.toDate(), end.toDate()]
            }
          },
        });
      
        monthlyRefferals.push({
          month: start.format("MMM"),
          noOfRefferals: refferals || 0
        });
      }
    }

    return res.status(200).json({
      success: true,
      totalRefferals: count,
      statusWiseRefferals: statusStats,
      loanTypeWiseRefferals: loanTypeStats,
      ...(monthlyRefferals.length > 0 && { monthlyRefferals }) // only include if present
    });

  } catch (error) {
    console.error("Error fetching refferal stats:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
  
// Delete a feedback
exports.deleteRefferal = async (req, res) => {
  try {
      const refferal = await Refferal.findByPk(req.params.id);
      if (!refferal) {
        return res.status(404).json({ message: 'refferal not found' });
      }
      await refferal.destroy();
      return res.status(200).json({ message: 'refferal deleted successfully' });
  } catch (error) {
  console.log("error is:- ", error);
  return res.status(400).json({ error: error.message });
  }
};