// Parses task ID from element ID
var getTaskIdFromElementId = function(taskId) {
    var arr = taskId.split("-");
    arr.splice(0, 1);
    return arr.join('-');
};

// Returns date string formatted as DD-MM-YYYY
var getFormattedDate = function (date) {
  var dateString = '';
  console.log(date);
  if (date instanceof Date) {
    dateString = date.getDate() + '-' + (date.getMonth() + 1) + '-' + date.getFullYear();
  } else if (date) {
    dateString = date;
  }
  return dateString;
};

var addGroupIndexListeners = function() {
  geddy.io.addListenersForModels(['Group']);

  var renderTemplate = function (group) {
    var template = [ ''
      , '<div class="row" id="group-' + group.id + '">'
      , '  <div class="col-12">'
      , '    <h3><a href="/groups/' + group.id + '">' + group.name + '</a></h3>'
      , '  </div>'
      , '</div>'
    ].join('');

    return $(template);
  }

  var GroupsController = function (opts) {
    this.options = opts || {};

    this.create = function (group) {
      $('#groups-list').append(renderTemplate(group));
    };

    this.update = function (group) {
      $('#group-' + group.id).replaceWith(renderTemplate(group));
    };

    this.remove = function (id) {
      $('#group-' + id).remove();
    };

  };
  geddy.Groups = new GroupsController();

  geddy.model.Group.on('save'   , geddy.Groups.create);
  geddy.model.Group.on('update' , geddy.Groups.update);
  geddy.model.Group.on('remove' , geddy.Groups.remove);
};

// Events for Group show
var addGroupListeners = function(userList, socket, userAvatars) {
  
  // Add instant search for tasks
  $('#task-filter').keyup(function() {
      var that = this;
      $.each($('#tasks-list .input-group'),
      function(i, val) {
          if ($(val).find('.form-control').val().toLowerCase().indexOf($(that).val().toLowerCase()) == -1) {
              $('#tasks-list .input-group').eq(i).hide();
          } else {
              $('#tasks-list .input-group').eq(i).show();
          }
      });
  });

  var pageId = window.location.pathname.split('/')[2];
  
  // Add listeners for Group
  geddy.io.addListenersForModels(['Group']);

  geddy.model.Group.on('update', function (group) {
    if (group.id == pageId) {
      var properties = group.toData();
      for (var i in properties) {
        $('.'+i).text(properties[i]);
      }
    }
  });

  geddy.model.Group.on('remove', function (id) {
    if (id == pageId) {
      window.location = '/groups';
    }
  });
  
  geddy.io.addListenersForModels(['Task']);

  var renderTemplate = function (task) {
    var checked = ''
    , complete = '';
    if (task.complete) {
      checked = ' checked="checked"';
      complete = ' completed-task';
    }
    
    var assignedUsers = '';
    
    if (task.assignedTo) {
      for (var i=0; i < task.assignedTo.length; i++) {
        assignedUsers +='<span class="input-group-addon task-assigned-avatar" data-user-id="' + task.assignedTo[i] + '">' + userAvatars[task.assignedTo[i]] + '</span>';
      } 
    }
    
    var dueDate = ''
    , dueIcon = '';
    
    if (task.dueDate && task.dueDate !== '' && moment(task.dueDate).isValid()) {
      var m = moment(task.dueDate);
      dueDate = m.format('MM-DD-YYYY');
      var tomorrow = moment().add('d', 1);
      if (m.isBefore(tomorrow)) {
        dueIcon = '<span class="input-group-addon past-due"><span class="past-due" data-toggle="tooltip" title="This task is due soon."><i class="icon-exclamation"></i></span></span>';
      }
    }
    
    var template = [ ''
      , '<div id="task-' + task.id + '" class="input-group' + complete + '">'
      , '  <span class="input-group-addon">'
      , '    <input type="checkbox" class="complete-task"' + checked +'>'
      , '  </span>'
      , '  <input type="text" class="form-control" disabled value="' + task.name + '">'
      , assignedUsers
      , dueIcon
      , '  <span class="input-group-btn">'
      , '    <button class="edit-task btn btn-default" type="button"><i class="icon-edit"></i></button>'
      , '    <button data-toggle="modal" href="#due-date-modal" class="set-due-date btn btn-default" data-due-date="' + dueDate + '"><i class="icon-calendar"></i></button>'
      , '    <button data-toggle="modal" href="#assign-modal" class="task-actions btn btn-default"><i class="icon-share"></i></button>'
      , '    <button class="done-editing btn btn-success" style="display:none" type="button"><i class="icon-check"></i></button>'
      , '    <button class="delete-task btn btn-danger" style="display:none" type="button"><i class="icon-remove-circle"></i></button>'
      , '  </span>'
      , '</div>'
    ].join('');

    return $(template);
  }

  // Add listeners for Task
  var TasksController = function (opts) {
    this.options = opts || {};

    this.create = function (task) {
      $('#tasks-list').append(renderTemplate(task));
    };

    this.update = function (task) {
      $('#task-' + task.id).replaceWith(renderTemplate(task));
    };

    this.remove = function (task) {
      console.log(task.id);
      $('#task-' + task.id).remove();
    };

  };
  geddy.Tasks = new TasksController();

  socket.on('taskCreated', geddy.Tasks.create);
  socket.on('taskUpdated', geddy.Tasks.update);
  socket.on('taskDeleted', geddy.Tasks.remove);
  
  var postTask = function() {
    var saveUrl = '/tasks.json'
    , taskName = $('#task-name').val()
    , groupId = $('#group-id').val()
    , userId = $('#user-id').val();
    
    $.post(saveUrl, { name: taskName, groupId: groupId}, function(data) {
      console.log(data);
      $('#task-name').val('');
    });
  };
  
  // Add event for adding task
  $('#task-name').keyup(function(e) {
    if (e.which == 13) {
        postTask();
    }
  });
  $(".container .input-group").on("click", "#add-task", function(event){
    postTask();
  });
  
  // Add event for editing tasks
  $(".container").on("click", ".edit-task", function(event){
    var taskId = $(this).closest('.input-group').attr('id');
    $('#' + taskId + ' .edit-task').hide();
    $('#' + taskId + ' .task-actions').hide();
    $('#' + taskId + ' .set-due-date').hide();
    $('#' + taskId + ' .done-editing').show();
    $('#' + taskId + ' .delete-task').show();
    $('#' + taskId + ' input[type="text"]').removeAttr("disabled");
  });
  
  // Add event to commit changes
  $(".container").on("click", ".done-editing", function(event){
    var taskId = $(this).closest('.input-group').attr('id');
    var id = getTaskIdFromElementId(taskId);
    var editedName = $('#' + taskId + ' input[type="text"]').val();
    
    $.ajax({
        url: '/tasks/' + id,
        type: 'PUT',
        data: { name: editedName },
        success: function(result) {
            // Do something with the result
            console.log(result);
        }
    });
    
    $('#' + taskId + ' .edit-task').show();
    $('#' + taskId + ' .task-actions').show();
    $('#' + taskId + ' .set-due-date').show();
    $('#' + taskId + ' .done-editing').hide();
    $('#' + taskId + ' .delete-task').hide();
    $('#' + taskId + ' input[type="text"]').attr("disabled", "disabled");
  });
  
  // Add event to delete tasks
  $(".container").on("click", ".delete-task", function(event){
    var taskId = $(this).closest('.input-group').attr('id');
    var id = getTaskIdFromElementId(taskId);
    var editedName = $('#' + taskId + ' input[type="text"]').val();
    // DELETE task
    $.ajax({
        url: '/tasks/' + id,
        type: 'DELETE',
        success: function(result) {
            // Do something with the result
            console.log(result);
        }
    });
  });
  
  // Add event to complete task
  $('#tasks-list').on("change", ".complete-task", function(event){
    var checkbox = this;
  
    var taskId = $(checkbox).closest('.input-group').attr('id');
  
    var id = getTaskIdFromElementId(taskId);
    
    var editedName = $('#' + taskId + ' input[type="text"]').val();
    // PUT updated task
    $.ajax({
        url: '/tasks/' + id,
        type: 'PUT',
        data: { complete: checkbox.checked},
        success: function(result) {
            // Do something with the result
            console.log(result);
        }
    });
  });
  
  // Add event to set task id for assignment on open modal
  $(".container").on("click", ".task-actions", function(event){
    var taskId = $(this).closest('.input-group').attr('id');
    var id = getTaskIdFromElementId(taskId);
    $('#assign-task-id').val(id);
    $('#' + taskId + ' .task-assigned-avatar').each(function(index) {
      var memberId = $(this).attr('data-user-id');
      $('#member-'  + memberId + ' .assign-task-member').prop('checked', true);
    });
  });
  
  // Add event to update assigned users on a task
  $(".container").on("click", "#submit-assign-task", function(event){
    var assignedUsers = [];
    
    $('.assign-task-member').each(function(index) {
      if ($(this).is(':checked')) {
        assignedUsers.push($(this).val());
      }
    });
    
    var id = $('#assign-task-id').val();
    
    $.ajax({
        url: '/tasks/' + id + '/assign',
        type: 'PUT',
        data: { assignedTo: assignedUsers},
        success: function(result) {
            if (result.success) {
              $('#assign-modal').modal('hide')
            } else {
              var errorMessage = '<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + result.error + '</div>';
              $('#assign-errors').html(errorMessage);
            }
        }
    });
  });
  
  // Add event or close of assignment modal
  $('#assign-modal').on('hide.bs.modal', function () {
    $('#assign-errors').html('');
    $('.assign-task-member').each(function(index) {
      $(this).prop('checked', false);
    });
    $('#assign-task-id').val('');
  });
  
  // Add event to set task id for due date on open modal
  $(".container").on("click", ".set-due-date", function(event){
    var taskId = $(this).closest('.input-group').attr('id');
    var id = getTaskIdFromElementId(taskId);
    var dueDate = $(this).attr('data-due-date');
    
    if (dueDate) {
      $('#due-date-picker input').val(dueDate);
      $('#due-date-picker').attr('data-date', dueDate);
    } else {
      $('#due-date-picker').attr('data-date', moment().format('MM-DD-YYYY'));
    }
    
    $('#due-date-task-id').val(id);
  });
  
  // Add event to update due date on task
  $(".container").on("click", "#submit-due-date", function(event){
    var id = $('#due-date-task-id').val();
    var dueDate = $('#due-date-picker input').val();
    
    $.ajax({
        url: '/tasks/' + id + '/set-date',
        type: 'PUT',
        data: { dueDate: dueDate},
        success: function(result) {
            if (result.success) {
              $('#due-date-modal').modal('hide');
            } else {
              var errorMessage = '<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + result.error + '</div>';
              $('#due-date-errors').html(errorMessage);
            }
        }
    });
  });
  // Add event on close of due date modal
  $('#due-date-modal').on('hide.bs.modal', function () {
    $('#due-date-errors').html('');
  });
};


$(document).ready(function() {
  $('#due-date-picker').datepicker();
  $('body').tooltip({
      selector: '[data-toggle="tooltip"]'
  });
  $('#invite-user').click(function(e) {
    var email = $('#invite-email').val();
    var groupId = $('#group-id').val();
    var userId = $('#user-id').val();
    if (groupId !== '' && userId !== '' && email !== '') {
      var url = '/invite?email=' + email + '&groupId=' + groupId + '&userId=' + userId
      $.getJSON(url, function(data) {
        if (data.success) {
          $('#invite-errors').html('<div class="alert alert-success alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>An invite was sent to that user.</div>');
        } else {
          $('#invite-errors').html('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + data.error + '</div>');
        }
      });
    } else {
      $('#invite-errors').html('<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>You must enter an email address.</div>');
    }
  });
});