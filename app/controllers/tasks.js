var passport = require('../helpers/passport')
, later = require('later')
, moment = require('moment');

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
        // If completing a repeated task
        if (task.complete && task.repeat) {
          console.log('Creating repeat task.');
          var m = moment(task.dueDate);
          console.log(m);
          var start = m.toDate();
          console.log(start);
          
          var sched = later.parse.text(task.repeat);
          console.log(sched);
          console.log(sched.schedules);
          
          var newDueDate = later.schedule(sched).next(2, start);
          console.log(newDueDate[newDueDate.length - 1]);
          
          var taskParams = {groupId: task.groupId, name: task.name, complete:false, repeat: task.repeat, dueDate: newDueDate[newDueDate.length - 1]};
          var newTask = geddy.model.Task.create(taskParams);
          
          if (!newTask.isValid()) {
            console.log('Invalid task params.');
          }
          
          newTask.save(function(err, data) {
            if (err) {
              console.log('Error creating repeat task.');
            }
            else {
              console.log('Repeat task created and saved.');
              geddy.io.sockets.in(task.groupId).emit('taskCreated', newTask);
            }
          });
        }
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
    if (params.id) {
      geddy.model.Task.first(params.id, function(err, task) {
          if (!task){
            self.respond({params: params, success: false, error: 'No task found with that id.'}, {format: 'json'});
          } else {
            if (params.assignedTo) {
              task.assignedTo = params.assignedTo;
            } else {
              task.assignedTo = []; 
            }
            task.save(function(err, data) {
              if (err) {
                self.respond({params: params, success: false, errors: err}, {format: 'json'});
              } else {
                geddy.io.sockets.in(task.groupId).emit('taskUpdated', task);
                self.respond({params: params, success: true}, {format: 'json'});
              }
            });
          }
      });
    } else {
      self.respond({params: params, success: false, error: 'Missing parameters.'}, {format: 'json'});
    }
  };
  
  this.setDate = function (req, resp, params) {
    var self = this;
    
    if (params.id && params.dueDate && moment(params.dueDate).isValid()) {
      geddy.model.Task.first(params.id, function(err, task) {
        geddy.model.User.first(self.session.get('userId'), function(err, user) {
            if (!task){
              self.respond({params: params, success: false, error: 'No task found with that id.'}, {format: 'json'});
            } else if (user.groups.indexOf(task.groupId) === -1){
              self.respond({params: params, success: false, error: 'You are not in the group that task belongs to.'}, {format: 'json'});
            } else {
              task.dueDate = params.dueDate;
              
              var interval = later.parse.text(params.repeat);
              
              if (interval && interval.schedules.length > 0) {
                // Add first repeat of task
                task.repeat = params.repeat;
              } else {
                task.repeat = false;
              }
              
              task.save(function(err, data) {
                if (err) {
                  self.respond({params: params, success: false, errors: err}, {format: 'json'});
                } else {
                  geddy.io.sockets.in(task.groupId).emit('taskUpdated', task);
                  self.respond({params: params, success: true}, {format: 'json'});
                }
              });
            }
        });
      });
    } else {
      self.respond({params: params, success: false, error: 'Invalid parameters.'}, {format: 'json'});
    }
  };
  
  this.checkInterval = function (req, resp, params) {
    var self = this;
    var interval = later.parse.text(params.repeat)
    
    console.log('Checking interval.');
    console.log(interval);
    
    if (interval && interval.schedules.length > 0 && interval.error === -1) {
      self.respond({params: params, success: true}, {format: 'json'});
    } else {
      self.respond({params: params, success: false, error: 'Invalid interval.'}, {format: 'json'});
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
