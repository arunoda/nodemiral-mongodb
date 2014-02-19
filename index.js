var nodemiral = require('nodemiral');
var path = require('path');

exports.install = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList("MongoDB Installation", taskListOptions);

  //setting mongodb options
  var mongoOptions = {
    replSet: vars.replSet || "meteor"
  };

  if(vars.options) {
    for(var key in vars.options) {
      mongoOptions[key] = vars.options;
    }
  }

  // Installation
  taskList.executeScript('install', {
    script: path.resolve(__dirname, 'scripts/install.sh')
  });

  // Create Admin User
  taskList.copy('copy script for admin user creation', {
    src: path.resolve(__dirname, 'scripts/set_admin_user.js'),
    dest: '/tmp/set_admin_user.js',
    vars: {adminPass: vars.adminPass}
  });

  taskList.executeScript('create admin user', {
    script: path.resolve(__dirname, 'scripts/set_admin_user.sh')
  });

  //setting the keyFile
  if(vars.key) {
    mongoOptions['keyFile'] = "/opt/nodemiral/mongodb/key_file";
    taskList.executeScript('create admin user', {
      script: path.resolve(__dirname, 'scripts/set_key_file.sh'),
      vars: {
        key: vars.key
      }
    });
  }

  //add production mongodb configuration
  taskList.copy('copy mongodb configuration', {
    src: path.resolve(__dirname, 'templates/mongodb.conf'),
    dest: '/etc/mongodb.conf',
    vars: {
      options: mongoOptions
    }
  });

  //restart
  taskList.execute('restart mongodb', getRestartTask());

  return taskList;
};

function getRestartTask() {
  return {
    command: "(sudo stop mongodb || :) && sudo start mongodb"
  };
}