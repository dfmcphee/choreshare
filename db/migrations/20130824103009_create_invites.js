var CreateInvites = function () {
  this.up = function (next) {
    var def = function (t) {
          t.column('userId', 'string');
          t.column('email', 'string');
          t.column('token', 'string');
          t.column('accepted', 'boolean');
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('invite', def, callback);
  };

  this.down = function (next) {
    var callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.dropTable('invite', callback);
  };
};

exports.CreateInvites = CreateInvites;
