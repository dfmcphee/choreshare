var CreateGroups = function () {
  this.up = function (next) {
    var def = function (t) {
          t.column('name', 'string');
          t.column('userId', 'string');
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('group', def, callback);
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
    this.dropTable('group', callback);
  };
};

exports.CreateGroups = CreateGroups;
