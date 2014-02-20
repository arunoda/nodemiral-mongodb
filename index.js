var nodemiral = require('nodemiral');
var path = require('path');

exports.install = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList("MongoDB Installation", taskListOptions);

  // Installation
  taskList.executeScript('install', {
    script: path.resolve(__dirname, 'scripts/install.sh')
  });

  taskList.copy('copy mongodb configuration', getConfigFileTask({auth: true}));
  taskList.execute('restart mongodb', getRestartTask());

  // Create Admin User
  taskList.copy('copy script for admin user creation', {
    src: path.resolve(__dirname, 'scripts/set_admin_user.js'),
    dest: '/tmp/set_admin_user.js',
    vars: {adminPass: vars.adminPass}
  });

  taskList.executeScript('create admin user', {
    script: path.resolve(__dirname, 'scripts/set_admin_user.sh')
  });

  return taskList;
};

exports.configure = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList("MongoDB Installation", taskListOptions);
  var mongoOptions = vars.options || {};

  //setting the keyFile
  if(vars.key) {
    mongoOptions['keyFile'] = "/opt/nodemiral/mongodb/key_file";
    taskList.executeScript('create key file', {
      script: path.resolve(__dirname, 'scripts/set_key_file.sh'),
      vars: {
        key: vars.key
      }
    });
  }

  //add production mongodb configuration
  taskList.copy('copy mongodb configuration', getConfigFileTask(mongoOptions));

  //restart
  taskList.execute('restart mongodb', getRestartTask());

  return taskList;
};

function getRestartTask() {
  return {
    command: "(sudo stop mongodb || :) && sudo start mongodb"
  };
}

function getConfigFileTask (options) {
  options = options || {};
  var mongoOptions = {
    dbpath: '/opt/nodemiral/mongodb/db',
    port: 27017,
    auth: true,
    nohttpinterface: true
  };

  for(var key in options) {
    mongoOptions[key] = options[key];
  }

  return {
    src: path.resolve(__dirname, 'templates/mongodb.conf'),
    dest: '/etc/mongodb.conf',
    vars: {
      options: mongoOptions
    }
  }
}