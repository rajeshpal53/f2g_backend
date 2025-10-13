const Booking = require('../models/booking');
const sequelize = require('../config/database');
const userController = require('./userController');
const User = require("../models/user");
const Status = require('../models/status');
const LoanType = require('../models/loanType');
const { Op } = require("sequelize");
const moment = require('moment');

// create booking
exports.createBooking = async (req, res) => {
  const {
    name,
    bookedBy,
    bookingAmount,
    tentativeBillAmount,
    loanAccountNumber,
    loantypefk,
    mobile,
    address,
    remark,
    bookId,
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

    // Create Invoice
    const booking = await Booking.create(
      {
        name,
        usersfk: user.id,
        bookedBy,
        bookingAmount,
        tentativeBillAmount,
        loanAccountNumber,
        loantypefk,
        address,
        remark,
        bookId,
        statusfk
      },
      { transaction }
    );
    
    await transaction.commit(); // Commit the transaction

    res.status(201).json(booking);
  } catch (error) {
    await transaction.rollback(); // Rollback on error
    console.error("error is:-", error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
  
  // Update a feedback
  exports.updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;

        // Find the feedback by primary key
        const booking = await Booking.findByPk(id);
        if (!booking) {
          return res.status(404).json({ message: 'booking not found' });
        }
        
        await booking.update(body);

         return res.status(200).json({
          success: true,
          message: 'Booking updated successfully',
          data: booking
        });
    } catch (error) {
        console.log("error is:- ", error);  
        return res.status(400).json({ error: error.message });
    }
  };

exports.getBooking = async (req, res) => {
  try {
    let { dateRange, statusfk, startDate, endDate, year, month, week, calenderView, sort, sortField, searchTerm, id, usersfk, loantypefk, page, limit } = req.query;
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

    // Try to parse the search term as a date (assuming YYYY-MM-DD format)
    let dateSearch = null;
    if (moment(searchTerm, "DD-MM-YYYY", true).isValid()) {
      dateSearch = moment(searchTerm, "DD-MM-YYYY").startOf("day").toDate();
    }

    if (searchTerm && searchTerm.trim() !== ""){
      whereClause[Op.or]= [
        // Adjust the fields to search based on your model
        { bookingAmount: { [Op.like]: `%${searchTerm}%` } },
        { tentativeBillAmount: { [Op.like]: `%${searchTerm}%` } },
        { loanAccountNumber: { [Op.like]: `%${searchTerm}%` } },
        { bookId: { [Op.like]: `%${searchTerm}%` } },
        { "$user.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$user.email$": { [Op.like]: `%${searchTerm}%` } },
        { "$status.status$": { [Op.like]: `%${searchTerm}%` } },
        { "$loantype.type$": { [Op.like]: `%${searchTerm}%` } },
        { "$bookedByUser.name$": { [Op.like]: `%${searchTerm}%` } },
        { "$bookedByUser.mobile$": { [Op.like]: `%${searchTerm}%` } },
        { "$bookedByUser.address$": { [Op.like]: `%${searchTerm}%` } },
        { "$bookedByUser.email$": { [Op.like]: `%${searchTerm}%` } },
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
    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: {
        ...whereClause,
      },
      include:[
        {model: Status, as: 'status'},
        {model : User, as : 'user'},
        {model : User , as : 'bookedByUser'},
        {model : LoanType , as : 'loantype'}
      ],
      order: orderCondition,
      //distinct: true,
      limit: pageSize,
      offset: offset
    });

    return res.status(200).json({
      success: true,
      totalBookings: count, // Total invoices found
      totalPages: Math.ceil(count / limit), // Total pages
      currentPage: page,
      bookings
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
  
// Delete a feedback
exports.deleteBooking = async (req, res) => {
  try {
      const booking = await Booking.findByPk(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: 'booking not found' });
      }
      await booking.destroy();
      return res.status(200).json({ message: 'booking deleted successfully' });
  } catch (error) {
  console.log("error is:- ", error);
  return res.status(400).json({ error: error.message });
  }
};