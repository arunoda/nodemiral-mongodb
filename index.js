var nodemiral = require('nodemiral');
var path = require('path');
var _ = require('underscore');

exports.install = function(vars, taskListOptions) {
  vars = vars || {}
  vars.version = vars.version || "3.0.6";
  vars.options = _.clone(vars.options) || {};
  vars.options.dbpath = vars.options.dbpath || '/opt/nodemiral/mongodb/db';

  var taskList = nodemiral.taskList("MongoDB Installation", taskListOptions);

  // Installation
  taskList.executeScript('install', {
    script: path.resolve(__dirname, 'scripts/install.sh'),
    vars: {
      version: vars.version,
      dbpath: vars.options.dbpath
    }
  });

  // Create Admin User
  if(vars.adminPass) {
    var initialOptions = _.pick(vars.options, "dbpath", "storageEngine");
    initialOptions.port = 27017;
    initialOptions.bind_ip = "127.0.0.1";

    addConfigFile(taskList, initialOptions);
    taskList.execute('restart mongod', getRestartTask());

    taskList.copy('copy script for admin user creation', {
      src: path.resolve(__dirname, 'scripts/set_admin_user.js'),
      dest: '/tmp/set_admin_user.js',
      vars: {adminPass: vars.adminPass}
    });

    taskList.executeScript('create admin user', {
      script: path.resolve(__dirname, 'scripts/set_admin_user.sh')
    });
  }

  // After the adminPass (set) if needed, we can add auth support and reload  
  vars.options.auth = true;
  addConfigFile(taskList, vars.options);
  taskList.execute('restart mongod', getRestartTask());

  return taskList;
};

exports.configure = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList("MongoDB Configurations", taskListOptions);
  vars.options = vars.options || {};
  vars.options.dbpath = vars.options.dbpath || '/opt/nodemiral/mongodb/db';

  //setting the keyFile
  if(vars.key) {
    vars.options['keyFile'] = "/opt/nodemiral/mongodb/key_file";
    taskList.executeScript('create key file', {
      script: path.resolve(__dirname, 'scripts/set_key_file.sh'),
      vars: {
        key: vars.key
      }
    });
  }

  //add production mongodb configuration
  addConfigFile(taskList, vars.options);

  //restart
  taskList.execute('restart mongod', getRestartTask());

  return taskList;
};

exports.configureReplSet = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList("Configurating Replicaset", taskListOptions);

  taskList.copy('copy replSet configuration script', {
    src: path.resolve(__dirname, 'scripts/configure_replset.js'),
    dest: '/tmp/configure_replset.js',
    vars: {
      replSet: vars.replSet,
      members: vars.members
    }
  });

  if(vars.pickPrimary) {
    taskList.executeScript('configuring the replSet', {
      script: path.resolve(__dirname, 'scripts/configure_replset.sh'),
      vars: {
        adminPass: vars.adminPass,
        dbHost: "<%= replSetPrimaryHost %>"
      }
    });

    var getPrimaryHost = exports.getPrimaryHost(vars, taskListOptions);
    return getPrimaryHost.concat([taskList], taskList._name);
  } else {
    taskList.executeScript('configuring the replSet', {
      script: path.resolve(__dirname, 'scripts/configure_replset.sh'),
      vars: {
        adminPass: vars.adminPass,
        dbHost: "127.0.0.1"
      }
    });

    return taskList;
  }
};

exports.setUsers = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList("Set Users", taskListOptions);

  var users = [];

  vars.users.forEach(function(user) {
    users.push({
      username: user.username,
      db: user.db,
      password: user.password,
      roles: user.roles
    });
  });

  taskList.copy('copy set_users.js', {
    src: path.resolve(__dirname, 'scripts/set_users.js'),
    dest: '/tmp/set_users.js',
    vars: {
      users: users
    }
  });

  if(vars.pickPrimary) {
    taskList.executeScript('setting users', {
      script: path.resolve(__dirname, 'scripts/set_users.sh'),
      vars: {
        dbHost: "<%= replSetPrimaryHost %>",
        adminPass: vars.adminPass
      }
    });

    var getPrimaryHost = exports.getPrimaryHost(vars, taskListOptions);
    return getPrimaryHost.concat([taskList], taskList._name);
  } else {
    taskList.executeScript('setting users', {
      script: path.resolve(__dirname, 'scripts/set_users.sh'),
      vars: {
        dbHost: "127.0.0.1",
        adminPass: vars.adminPass
      }
    });

    return taskList;
  }
};

exports.getPrimaryHost = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList("Pick Primary", taskListOptions);

  taskList.copy('copy pick_primary.js', {
    src: path.resolve(__dirname, 'scripts/pick_primary.js'),
    dest: '/tmp/pick_primary.js'
  });

  taskList.executeScript('picking the primary', {
    script: path.resolve(__dirname, 'scripts/pick_primary.sh'),
    vars: {
      adminPass: vars.adminPass
    }
  }, function(stdout, stderr) {
    this.replSetPrimaryHost = stdout.match(/primaryMongoHost:(.*);;/)[1];
  });

  return taskList;
};

function getRestartTask() {
  return {
    command: "(sudo stop mongod || :) && sudo start mongod"
  };
}

function addConfigFile(taskList, options) {
  options = options || {};
  var mongoOptions = {
    port: 27017,
    nohttpinterface: true
  };

  for(var key in options) {
    mongoOptions[key] = options[key];
  }

  var tempFile = "/tmp/mongodb.conf"; 

  taskList.copy('copy mongodb configuration', {
    src: path.resolve(__dirname, 'templates/mongodb.conf'),
    dest: tempFile,
    vars: {
      options: mongoOptions
    }
  });

  taskList.execute('set mongodb configuration', {
    command: "sudo mv " + tempFile + " /etc/mongod.conf"
  });

  taskList.execute('chown dbpath', {
    command: "sudo chown mongodb " + mongoOptions.dbpath
  });
}

exports.ALL_ROLES = ['clusterAdmin', 'userAdminAnyDatabase', 'dbAdmin', 'userAdmin', 'readWriteAnyDatabase', 'dbAdminAnyDatabase'];