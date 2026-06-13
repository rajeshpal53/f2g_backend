const Status = require('../models/status');

// Create a new status
exports.createStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const statuses = await Status.create({ status });
    res.status(201).json({ message: 'Status created successfully', statuses });
  } catch (error) {
    next(error);
  }
};

// Get all statuses
exports.getAllStatuses = async (req, res, next) => {
  try {
    const statuses = await Status.findAll();
    res.status(200).json(statuses);
  } catch (error) {
    next(error);
  }
};

// Get a status by ID
exports.getStatusById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await Status.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

// Update a status by ID
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const statuses = await Status.findByPk(id);
    if (!statuses) {
      return res.status(404).json({ error: 'Status not found' });
    }
    statuses.status = status || statuses.status;
    await statuses.save();
    res.status(200).json({ message: 'Status updated successfully', statuses });
  } catch (error) {
    next(error);
  }
};

// Delete a status by ID
exports.deleteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const status = await Status.findByPk(id);
    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }
    await status.destroy();
    res.status(200).json({ message: 'Status deleted successfully' });
  } catch (error) {
    next(error);
  }
};
