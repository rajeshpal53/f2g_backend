const notificationController = require('../controllers/notificationController');
const mail = require('./sendMail');
const User = require("../models/user");

const getUser = async (userfk) => {
  const user = await User.findByPk(userfk);
  return user;
};
  
const getAdmins = async () => {
  const admins = await User.findAll({
  where: { roles: 'admin'},
  });
  return admins;
};
  

  function setReqAndSendNotificatonData(req, obj) {
      req.body.title = obj.title;
      req.body.body = obj.body;
      req.body.tokens = obj.tokens;
      req.body.extraData = obj.extraData;
      req.body.image = obj.image;
      req.body.screen = obj.screen;
      console.log("obj notificatio", req.body)
        notificationController.sendMultipleNotification(req);
       return "success";
  }

  exports.sendMail = (mailsId) => {
    mail.sendLoginMail(mailsId);
  }
