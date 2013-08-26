var User = function () {
  this.defineProperties({
    username: {type: 'string', required: true},
    password: {type: 'string', required: true},
    familyName: {type: 'string', required: true},
    givenName: {type: 'string', required: true},
    email: {type: 'string', required: true},
    avatar: {type: 'string'},
    groups: {type: 'object'}
  });

  this.validatesLength('username', {min: 3});
  this.validatesLength('password', {min: 8});
  this.validatesConfirmed('password', 'confirmPassword');

  this.hasMany('Passports');
  
  this.getAvatar = function () {
    var avatar;
    if (this.avatar) {
      avatar = '<img src="' + this.avatar + '" />';
    } else {
      avatar = '<i class="icon-user"></i>';
    }
    return avatar;
  };
};

User = geddy.model.register('User', User);

