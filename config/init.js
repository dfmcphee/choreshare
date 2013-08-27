var nodemailer = require("nodemailer");

// Create reusable transport method (opens pool of SMTP connections)
geddy.smtpTransport = nodemailer.createTransport("SMTP", geddy.config.mailer);

geddy.getFormattedDate = function (date) {
  var dateString = '';
  if (date) {
    dateString = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
  }
  return dateString;
};

geddy.moment = require("moment");

var init = function(cb) {
  // Add uncaught-exception handler in prod-like environments
  if (geddy.config.environment != 'development') {
    process.addListener('uncaughtException', function (err) {
      var msg = err.message;
      if (err.stack) {
        msg += '\n' + err.stack;
      }
      if (!msg) {
        msg = JSON.stringify(err);
      }
      geddy.log.error(msg);
    });
  }
  cb();
};

exports.init = init;