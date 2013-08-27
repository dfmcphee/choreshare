var passport = require('../helpers/passport')
, path           = require('path')
, templatesDir   = path.resolve(__dirname, '../views', 'email-templates')
, emailTemplates = require('email-templates')
, nodemailer     = require('nodemailer')
, hat = require('hat');

var sendGroupInvite = function(email, user, group, token) {
  emailTemplates(templatesDir, function(err, template) {
      if (err) {
        console.log(err);
      } else {
        // Setup data for email
        var locals = {
          email: email,
          name: user.givenName + ' ' + user.familyName,
          group: group.name,
          signupLink: 'http://' + geddy.config.externalURL + '/users/add',
          acceptLink: 'http://' + geddy.config.externalURL + '/accept-invite?token=' + token,
        };
    
        // Send email
        template('invite', locals, function(err, html, text) {
          if (err) {
            console.log(err);
          } else {
            geddy.smtpTransport.sendMail({
              from: 'ChoreShare <choreshare@gmail.com>',
              to: locals.email,
              subject: 'You have been invited to join a group on Duties App!',
              html: html,
              text: text
            }, function(err, responseStatus) {
              if (err) {
                console.log(err);
              } else {
                console.log(responseStatus.message);
              }
            });
          }
        });
      }
    });
};

var Groups = function () {
  this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];
  this.before(passport.requireAuth);

  this.index = function (req, resp, params) {
    var self = this;
    geddy.model.User.first(self.session.get('userId'), function(err, user) {
      
      if (user.groups && user.groups.length > 0) {
        var ids = [];
        for (var i=0; i < user.groups.length; i++) {
          ids.push({id: user.groups[i]});
        }
        geddy.model.Group.all({or: ids}, function(err, groups) {
          self.respond({params: params, groups: groups});
        });
      } else {
        self.respond({params: params, groups: []});
      }
    });
  };

  this.add = function (req, resp, params) {
    this.respond({params: params});
  };

  this.create = function (req, resp, params) {
    var self = this
      , group = geddy.model.Group.create(params);
    
    group.userId = self.session.get('userId');
    
    if (!group.isValid()) {
      this.flash.error(group.errors);
      this.redirect({action: 'add'});
    }
    else {
      group.save(function(err, data) {
        if (err) {
          self.flash.error(err);
          self.redirect({action: 'add'});
        }
        else {
          geddy.model.User.first(group.userId, function(err, user) {
            if (!user.groups) {
              user.groups = [];
            }
            user.groups.push(group.id);
            user.save();
            self.redirect({controller: self.name});
          });
        }
      });
    }
  };

  this.show = function (req, resp, params) {
    var self = this;
    
    geddy.model.User.first(self.session.get('userId'), function(err, user) {
      if (user && user.groups && user.groups.indexOf(params.id) !== -1) {
        geddy.model.Group.first(params.id, function(err, group) {
          geddy.model.User.all({groups: group.id}, function(err, members) {
            var membersIndexed = {};
            for (var i=0; i < members.length; i++) {
              membersIndexed[members[i].id] = members[i];
            }
            geddy.model.Task.all({groupId: group.id}, {sort: {dueDate: 'asc', complete: 'asc'}}, function(err, tasks) {
              for (var i=0; i < tasks.length; i++) {
                tasks[i].checked = ''
                tasks[i].completeClass = ''
                tasks[i].formattedDate = ''
                tasks[i].dueIcon = '';
                if (tasks[i].complete) {
                    tasks[i].checked = ' checked="checked"';
                    tasks[i].completeClass = ' completed-task';
                }
                if (tasks[i].dueDate && geddy.moment(tasks[i].dueDate).isValid()) {
                  var m = geddy.moment(tasks[i].dueDate);
                  tasks[i].formattedDate = m.format('MM-DD-YYYY');
                  var tomorrow = geddy.moment().add('d', 1);
                  if (m.isBefore(tomorrow)) {
                    tasks[i].dueIcon = '<span class="input-group-addon past-due"><span class="past-due" data-toggle="tooltip" title="This task is due soon."><i class="icon-exclamation"></i></span></span>';
                  }
                }
              }
              if (!group) {
                var err = new Error();
                err.statusCode = 404;
                self.error(err);
              }
              else {
                self.respond({params: params, group: group, tasks: tasks, members: membersIndexed});
              }
            });
          });
        });
      } else {
        var err = new Error();
        err.statusCode = 404;
        self.error(err);
      }
    });
  };
  
  this.invite = function (req, resp, params) {
    var self = this;
    
    if (params.email && params.userId && params.groupId) {
      geddy.model.Invite.first({email: params.email, groupId: params.groupId}, function (err, existingInvite) {
        if (!existingInvite) {
          geddy.model.User.first(params.userId, function(err, user) {
            geddy.model.Group.first(params.groupId, function(err, group) {
              // Generate token with hat
              var token = hat();
              
              var invite = geddy.model.Invite.create({email: params.email, groupId: group.id, token: token, accepted: false});
              
              invite.save();
              
              sendGroupInvite(params.email, user, group, token);
              
              self.respond({params: params, success: true}, {format: 'json'});
            });
          });
        } else {
          self.respond({params: params, success: false, error: 'User has already been invited to this group.'}, {format: 'json'});
        }
      });
    } else {
      self.respond({params: params, success: false, error: 'Missing parameters.'}, {format: 'json'});
    }
  };
  
  this.accept = function (req, resp, params) {
    var self = this;

    geddy.model.Invite.first({token: params.token}, function (err, invite) {
      geddy.model.User.first(self.session.get('userId'), function(err, user) {
        if (invite && user) {
          if (!user.groups) {
            user.groups = [];
          }
          user.groups.push(invite.groupId);
          user.save(function(err, data) {
            invite.accepted = true;
            invite.save();
            self.redirect('/groups/' + invite.groupId);
          });
        } else {
          var err = new Error();
          err.statusCode = 400;
          self.error(err);
        }
      });
    });
  };

  this.edit = function (req, resp, params) {
    var self = this;

    geddy.model.Group.first(params.id, function(err, group) {
      if (!group) {
        var err = new Error();
        err.statusCode = 400;
        self.error(err);
      }
      else {
        self.respond({params: params, group: group});
      }
    });
  };

  this.update = function (req, resp, params) {
    var self = this;

    geddy.model.Group.first(params.id, function(err, group) {
      group.updateProperties(params);
      if (!group.isValid()) {
        this.flash.error(group.errors);
        this.redirect({action: 'edit'});
      }
      else {
        group.save(function(err, data) {
          if (err) {
            self.flash.error(err);
            self.redirect({action: 'edit'});
          }
          else {
            self.redirect({controller: self.name});
          }
        });
      }
    });
  };

  this.destroy = function (req, resp, params) {
    var self = this;

    geddy.model.Group.remove(params.id, function(err) {
      if (err) {
        self.flash.error(err);
        self.redirect({action: 'edit'});
      }
      else {
        geddy.model.User.all({groups: params.id}, function(err, users) {
          for (var i=0; i < users.length; i++) {
            var index = array.indexOf(params.id);
            users[i].groups.splice(index, 1);
            users[i].save(); 
          }
          self.redirect({controller: self.name});
        });
      }
    });
  };

};

exports.Groups = Groups;
