'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      mobile: { type: Sequelize.STRING, unique: true, allowNull: false },
      whatsappnumber: { type: Sequelize.STRING(10), allowNull: true },
      aadharCard: { type: Sequelize.STRING(12), allowNull: true },
      aadharCardFronturl: { type: Sequelize.STRING, allowNull: true },
      aadharCardBackurl: { type: Sequelize.STRING, allowNull: true },
      profilePicurl: { type: Sequelize.STRING, allowNull: true },
      name: { type: Sequelize.STRING },
      dob: { type: Sequelize.STRING },
      gender: { type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true },
      email: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      pincode: { type: Sequelize.INTEGER },
      password: { type: Sequelize.STRING, allowNull: false },
      token_validity: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      latitude: { type: Sequelize.DECIMAL(9, 6) },
      longitude: { type: Sequelize.DECIMAL(9, 6) },
      fcmtokens: { type: Sequelize.JSON },
      roles: { type: Sequelize.ENUM('user', 'admin'), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }, { ifNotExists: true });

    await queryInterface.createTable('Statuses', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      status: {
        type: Sequelize.ENUM(
          'login incomplete', 'login done', 'pd doc', 'reject', 'l and t stage',
          'sub approved', 'approved', 'disbursed', 'otc/pdd pending',
          'billing in process', 'billing cleared', 'lead generated', 'booking initiated'
        ),
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }, { ifNotExists: true });

    await queryInterface.createTable('LoanTypes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      type: {
        type: Sequelize.ENUM('home', 'personal', 'property', 'car', 'business', 'cvLoan', 'auto', 'other'),
        allowNull: false,
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }, { ifNotExists: true });

    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: true },
      usersfk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      bookedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      bookingAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      tentativeBillAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      loanAccountNumber: { type: Sequelize.STRING, allowNull: false },
      bankOrNBFCName: { type: Sequelize.STRING, allowNull: false },
      loantypefk: {
        type: Sequelize.INTEGER,
        allowKey: false,
        references: { model: 'LoanTypes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      address: { type: Sequelize.STRING(255), allowNull: true },
      remark: { type: Sequelize.TEXT, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      bookId: { type: Sequelize.STRING, allowNull: false },
      statusfk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Statuses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }, { ifNotExists: true });

    await queryInterface.createTable('refferals', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: true },
      usersfk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      refferedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      loanAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      loantypefk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'LoanTypes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      address: { type: Sequelize.STRING(255), allowNull: true },
      remark: { type: Sequelize.TEXT, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      refId: { type: Sequelize.STRING, allowNull: false },
      statusfk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Statuses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }, { ifNotExists: true });

    await queryInterface.createTable('Feedbacks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      feedbackType: {
        type: Sequelize.ENUM(
          'Complaint', 'Questions', 'Suggestion', 'Comment',
          'Feature Request', 'Bug Report', 'Others', 'Loan Requirement'
        ),
        allowNull: false,
      },
      isResolved: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      resolvedMessage: { type: Sequelize.TEXT, allowNull: true },
      name: { type: Sequelize.STRING, allowNull: false },
      mobile: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING },
      screenShotUrl: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }, { ifNotExists: true });

    await queryInterface.createTable('ApplyForLoans', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      mobile: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      loanAmount: { type: Sequelize.STRING },
      loantypefk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'LoanTypes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    }, { ifNotExists: true });
  },

  async down(queryInterface, Sequelize) {
    // Drops in reverse order to respect foreign key constraints.
    // WARNING: this destroys all data in these tables.
    await queryInterface.dropTable('ApplyForLoans', { ifExists: true });
    await queryInterface.dropTable('Feedbacks', { ifExists: true });
    await queryInterface.dropTable('refferals', { ifExists: true });
    await queryInterface.dropTable('bookings', { ifExists: true });
    await queryInterface.dropTable('LoanTypes', { ifExists: true });
    await queryInterface.dropTable('Statuses', { ifExists: true });
    await queryInterface.dropTable('Users', { ifExists: true });
  },
};
