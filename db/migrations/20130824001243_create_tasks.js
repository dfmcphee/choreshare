var CreateTasks = function () {
  this.up = function (next) {
    var def = function (t) {
          t.column('name', 'string');
          t.column('groupId', 'string');
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('task', def, callback);
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
    this.dropTable('task', callback);
  };
};

exports.CreateTasks = CreateTasks;
