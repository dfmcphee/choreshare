var passport = require('../helpers/passport');

var Tasks = function () {
  this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];
  this.before(passport.requireAuth);
  
  this.index = function (req, resp, params) {
    var self = this;

    geddy.model.Task.all(function(err, tasks) {
      self.respond({params: params, tasks: tasks});
    });
  };

  this.add = function (req, resp, params) {
    this.respond({params: params});
  };

  this.create = function (req, resp, params) {
    var self = this
      , task = geddy.model.Task.create(params);

    if (!task.isValid()) {
      this.flash.error(task.errors);
      this.redirect({action: 'add'});
    }
    else {
      task.save(function(err, data) {
        if (err) {
          self.respond({params: params, success: false, error: err}, {format: 'json'});
        }
        else {
          geddy.io.sockets.in(task.groupId).emit('taskCreated', task);
          self.respond({params: params, success: true}, {format: 'json'});
        }
      });
    }
  };

  this.show = function (req, resp, params) {
    var self = this;

    geddy.model.Task.first(params.id, function(err, task) {
      if (!task) {
        var err = new Error();
        err.statusCode = 404;
        self.error(err);
      }
      else {
        self.respond({params: params, task: task.toObj()});
      }
    });
  };

  this.edit = function (req, resp, params) {
    var self = this;

    geddy.model.Task.first(params.id, function(err, task) {
      if (!task) {
        var err = new Error();
        err.statusCode = 400;
        self.error(err);
      }
      else {
        self.respond({params: params, task: task});
      }
    });
  };

  this.update = function (req, resp, params) {
    var self = this;

    geddy.model.Task.first(params.id, function(err, task) {
      task.updateProperties(params);
      if (!task.isValid()) {
        self.respond({params: params, success: false, errors: task.errors}, {format: 'json'});
      }
      else {
        task.save(function(err, data) {
          if (err) {
            self.respond({params: params, success: false, errors: err}, {format: 'json'});
          }
          else {
            geddy.io.sockets.in(task.groupId).emit('taskUpdated', task);
            self.respond({params: params, success: true}, {format: 'json'});
          }
        });
      }
    });
  };
  
  this.assign = function (req, resp, params) {
    var self = this;
    if (params.id && params.username) {
      geddy.model.Task.first(params.id, function(err, task) {
        geddy.model.User.first({username: params.username}, function(err, user) {
          if (!task.assignedTo) {
            task.assignedTo = [];
          }
          if (!user){
            self.respond({params: params, success: false, error: 'No user found with that username.'}, {format: 'json'});
          } else if (task.assignedTo.indexOf(user.id) !== -1) {
            self.respond({params: params, success: false, error: 'User is already assigned to task.'}, {format: 'json'});
          } else {
            task.assignedTo.push(user.id);
            task.save(function(err, data) {
              if (err) {
                self.respond({params: params, success: false, errors: err}, {format: 'json'});
              } else {
                self.respond({params: params, success: true}, {format: 'json'});
              }
            });
          }
        });
      });
    } else {
      self.respond({params: params, success: false, error: 'Missing parameters.'}, {format: 'json'});
    }
  };

  this.destroy = function (req, resp, params) {
    var self = this;
    geddy.model.Task.first(params.id, function(err, task) {
      var groupId = task.groupId;
      geddy.model.Task.remove(params.id, function(err) {
        if (err) {
          self.respond({params: params, success: false, errors: err}, {format: 'json'});
        }
        else {
          geddy.io.sockets.in(groupId).emit('taskDeleted', task);
          self.respond({params: params, success: true}, {format: 'json'});
        }
      });
    });
  };
};

exports.Tasks = Tasks;
