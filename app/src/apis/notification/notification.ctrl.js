'use strict';

const Notification = require('../../models/services/Notification/Notification');

const process = {
  findAllById: async (req, res) => {
    const notification = new Notification(req);
    const response = await notification.findAllById();

    if (response.success) {
      return res.status(200).json(response);
    }
    if (response.isError) {
      return res.status(500).json(response.clientMsg);
    }
    return res.status(400).json(response);
  },

  deleteByNotificationNum: async (req, res) => {
    const notification = new Notification(req);
    const response = await notification.deleteByNotificationNum();

    if (response.success) {
      return res.status(200).json(response);
    }
    if (response.isError) {
      return res.status(500).json(response.clientMsg);
    }
    return res.status(400).json(response);
  },
};

module.exports = { process };
