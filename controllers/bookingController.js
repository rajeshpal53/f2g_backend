const Booking = require('../models/booking');
const sequelize = require('../config/database');
const userController = require('./userController');
const User = require("../models/user");
const Status = require('../models/status');
const LoanType = require('../models/loanType');
const { Op, Sequelize } = require("sequelize");
const moment = require('moment');
const ExcelJS = require("exceljs");
const { downloadReport } = require("../utility/report");
const utility = require('../utility/utility');

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
    bankOrNBFCName,
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
        bankOrNBFCName,
        bookId : `bk-${formattedDate}-${user.id}`,
        statusfk
      },
      { transaction }
    );
    
    await transaction.commit(); // Commit the transaction

    utility.sendCreateBookingNotificationToAdmin(req);

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
    const previousStatus = booking.statusfk;
    
    await booking.update(body);
    // If status has changed, send notification
    if (body.statusfk && body.statusfk !== previousStatus) {
      utility.sendStatusNotification(req, booking, "booking");
    }
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
    let { dateRange, statusfk, startDate, endDate, year, month, week, calenderView, sort, sortField, searchTerm, id, usersfk, bookedBy, loantypefk, page, limit } = req.query;
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

    if(bookedBy){
      whereClause.bookedBy = bookedBy;
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

exports.getBookingStats = async (req, res) => {
  try {
    const { dateRange, startDate, endDate, year, month, bookedBy, usersfk } = req.query;

    // Base where clause
    let whereClause = {};
    
    if(bookedBy){
      whereClause.bookedBy = bookedBy;
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

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      //distinct: true, 
      include: [
        {model: Status, as: 'status'},
        {model : User, as : 'user'},
        {model : User , as : 'bookedByUser'},
        {model : LoanType , as : 'loantype'}
      ]
    });    

     // If no bookings, return zero stats
    if (count === 0) {
     return res.status(200).json({
       success: true,
       noOfBookings: 0,
       statusWiseBookings: {},
       loanTypeWiseBookings: {}
     });
    }
  
    // --- STATUS-WISE COUNTS ---
    const statusWiseBookings = await Booking.findAll({
      where: whereClause,
      attributes: [
        "statusfk",
        [Sequelize.fn("COUNT", Sequelize.col("bookings.statusfk")), "count"],
      ],
      include: [{ model: Status, as: "status", attributes: ["status"] }],
      group: ["bookings.statusfk", "status.status"],
      raw: true,
    });

    const statusStats = {};
    statusWiseBookings.forEach((s) => {
      statusStats[s["status.status"]] = parseInt(s.count, 10);
    });
    
    // --- loan type-WISE COUNTS ---
    const loanTypeWiseBookings = await Booking.findAll({
      where: whereClause,
      attributes: [
        "loantypefk",
        [Sequelize.fn("COUNT", Sequelize.col("bookings.loantypefk")), "count"],
      ],
      include: [{model : LoanType , as : 'loantype', attributes: ["type"] }],
      group: ["bookings.loantypefk", "loantype.type"],
      raw: true,
    });

    const loanTypeStats = {};
    loanTypeWiseBookings.forEach((s) => {
      loanTypeStats[s["loantype.type"]] = parseInt(s.count, 10);
    });

    let monthlyBookings = [];

    if (year && !month && !startDate && !endDate && !dateRange) {
      for (let m = 0; m < 12; m++) {
        const start = moment(`${year}-${m + 1}-01`, "YYYY-MM-DD").startOf('month');
        const end = start.clone().endOf('month');
      
        const bookings = await Booking.count({
          where: {
            createdAt: {
              [Op.between]: [start.toDate(), end.toDate()]
            }
          },
        });
      
        monthlyBookings.push({
          month: start.format("MMM"),
          noOfBookings: bookings || 0
        });
      }
    }

    return res.status(200).json({
      success: true,
      totalBookings: count,
      statusWiseBookings: statusStats,
      loanTypeWiseBookings: loanTypeStats,
      ...(monthlyBookings.length > 0 && { monthlyBookings }) // only include if present
    });

  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.downloadBookings = async (req, res) => {
  try {
    let { dateRange, statusfk, startDate, endDate, year, month, week, calenderView, sort, sortField, searchTerm, id, usersfk, bookedBy, loantypefk, type} = req.query;
    if(!type){
      return res.status(400).json({ message: 'type is required' });
    }
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

    if(bookedBy){
      whereClause.bookedBy = bookedBy;
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

    // Fetch all bookings with associations
    const bookings = await Booking.findAll({
      where: {
        ...whereClause,
      },
      include: [
        {model: Status, as: 'status'},
        {model : User, as : 'user'},
        {model : User , as : 'bookedByUser'},
        {model : LoanType , as : 'loantype'}
      ],
      order: orderCondition,
    });

    if(bookings.length == 0){
      return res.status(404).json({ error: 'No bookings found' });
    }

    if(type == "excel"){
      // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bookings");

    // Define columns
    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Book ID", key: "bookId", width: 20 },
      { header: "Name", key: "userName", width: 20 },
      { header: "Booked By", key: "bookedByName", width: 20 },
      { header: "Loan Type", key: "loanType", width: 15 },
      { header: "Loan Account No.", key: "loanAccountNumber", width: 20 },
      { header: "Booking Amount", key: "bookingAmount", width: 15 },
      { header: "Tentative Bill", key: "tentativeBillAmount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Remark", key: "remark", width: 30 },
    ];

    // Add rows
    bookings.forEach((b) => {
      worksheet.addRow({
        id: b.id,
        bookId: b.bookId,
        userName: b.user?.name || "-",
        bookedByName: b.bookedByUser?.name || "-",
        loanType: b.loantype?.type || "-",
        loanAccountNumber: b.loanAccountNumber,
        bookingAmount: b.bookingAmount,
        tentativeBillAmount: b.tentativeBillAmount,
        status: b.status?.status || "-",
        address: b.address || "-",
        remark: b.remark || "-",
      });
    });

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bookings_${Date.now()}.xlsx`
    );

    // Write the file to response
    await workbook.xlsx.write(res);
    res.end();
    } else if(type == "pdf"){
      const data = bookings ? JSON.parse(JSON.stringify(bookings)) : null;

      console.log(JSON.stringify(data),"downloadBookings");

      if (!data) {
        return res.status(404).json({ error: "bookings not found" });
      }

      // Generate the PDF and send it in response
      return downloadReport(data, res);
    } else {
      return res.status(404).json({ error: 'type does not match pdf or excel' });
    }

  } catch (error) {
    console.error("Error downloading bookings:", error);
    res.status(500).json({ message: "Error downloading bookings:", error: error.message });
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