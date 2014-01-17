var nodemiral = require('nodemiral');
var path = require('path');

/*
  vars: vars for the paramters, following fields are containing
    adminPass: password for the global admin (cannot reset)
*/
exports.install = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList('MongoDB Installation', taskListOptions);
  
  taskList.executeScript('install', {
    script: path.resolve(__dirname, 'scripts/install.sh')
  });

  //we need config mongo first without replset to set the passwords
  taskList.copy('config for passwords', {
    src: path.resolve(__dirname, 'templates/mongodb.conf'),
    dest: '/etc/mongodb.conf',
    vars: { replSet: false }
  });

  taskList.copy('copy set_admin_user script', {
    src: path.resolve(__dirname, 'scripts/set_admin_user.js'),
    dest: '/tmp/set_admin_user.js',
    vars: {adminPass: vars.adminPass}
  });

  taskList.executeScript('set passwords', {
    script: path.resolve(__dirname, 'scripts/set_admin_user.sh')
  });

  //we need to config mongo again for replset and do the necessory initialization with using the adminPassword
  taskList.copy('config for replicaSet', {
    src: path.resolve(__dirname, 'templates/mongodb.conf'),
    dest: '/etc/mongodb.conf',
    vars: { replSet: true }
  });

  taskList.copy('copy init_repl_set script', {
    src: path.resolve(__dirname, 'scripts/init_repl_set.js'),
    dest: '/tmp/init_repl_set.js',
    vars: {adminPass: vars.adminPass}
  });

  taskList.executeScript('initalize replicaSet', {
    script: path.resolve(__dirname, 'scripts/init_repl_set.sh'),
    vars: {adminPass: vars.adminPass}
  });

  taskList.execute('updating-status', {
    command: 'echo installed | sudo tee /opt/comet/mongodb/status'
  });

  return taskList;
};

/*
  vars: vars for the paramters, following fields are containing
    adminPass: password of the global dbAdmin (required)
    passwords:
      app: password for the meteor app (optional)
      direct: password for the direct connection (optional)
      oplog: password for the oplog (optional)
    profile: whether to profile or now (optional)
*/
exports.configure = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList('Set MongoDB Passwords', taskListOptions);

  //we need to config mongo again for replset and do the necessory initialization with using the adminPassword
  taskList.copy('sending upstart setting again', {
    src: path.resolve(__dirname, 'templates/mongodb.conf'),
    dest: '/etc/mongodb.conf',
    vars: { replSet: true, profile: vars.profile }
  });

  //restart mongodb
  taskList.execute('ensure start', {
    command: "(sudo stop mongodb || :) && sudo start mongodb"
  });

  var users = {};

  if(vars.passwords && vars.passwords.app) {
    users['app'] = {db: 'app', password: vars.passwords.app, roles: ['readWrite', 'dbAdmin', 'userAdmin']};
  }

  if(vars.passwords && vars.passwords.direct) {
    users['direct'] = {db: 'app', password: vars.passwords.direct, roles: ['readWrite', 'dbAdmin', 'userAdmin']};
  }

  if(vars.passwords && vars.passwords.local) {
    users['local'] = {db: 'local', password: vars.passwords.local, roles: ['read']};
  }

  taskList.copy('set_passwords.js', {
    src: path.resolve(__dirname, 'scripts/set_passwords.js'),
    dest: '/tmp/set_passwords.js',
    vars: {
      users: users,
      adminPass: vars.adminPass
    }
  });

  taskList.executeScript('set_passwords.sh', {
    script: path.resolve(__dirname, 'scripts/set_passwords.sh'),
    vars: {
      adminPass: vars.adminPass,
      script: '/tmp/set_passwords.js'
    }
  });

  taskList.execute('updating-status', {
    command: 'echo configured | sudo tee /opt/comet/mongodb/status'
  });

  return taskList;
};

/*
  vars: vars for the paramters, following fields are containing
    no fileds for now - needs no input
*/
exports.start = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList('Start MongoDB', taskListOptions);
  taskList.execute('start', {
    command: "sudo start mongodb || :"
  });

  return taskList;
};

/*
  vars: vars for the paramters, following fields are containing
    no fileds for now - needs no input
*/
exports.stop = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList('Stop MongoDB', taskListOptions);
  taskList.execute('stop', {
    command: "sudo stop mongodb || :"
  });

  return taskList;
};

/*
  vars: vars for the paramters, following fields are containing
    apiKey - apiKey for the s3
    secret - secret for s3
    bucket - bucket to store
    id - unique id for the backup which will be used to save your backup as /<id>.tar.gz
    db - { username: 'username for the app db', password: 'password' }
*/
exports.backup = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList('Backup MongoDB', taskListOptions);
  
  taskList.copy('copy s3_backup script', {
    src: path.resolve(__dirname, 'scripts/s3_backup.js'),
    dest: '/tmp/s3_backup.js',
    vars: {
      apiKey: vars.apiKey,
      secret: vars.secret,
      bucket: vars.bucket,
      id: vars.id
    }
  }); 

  taskList.executeScript('backup mongo', {
    script: path.resolve(__dirname, 'scripts/s3_backup.sh'),
    vars: {
      username: vars.db.username,
      password: vars.db.password
    }
  });

  return taskList;
};

/*
  vars: vars for the paramters, following fields are containing
    url - url of the backup tar ball
    db - { username: 'username for the app db', password: 'password' }
*/
exports.restore = function(vars, taskListOptions) {
  var taskList = nodemiral.taskList('Restore MongoDB', taskListOptions);

  taskList.executeScript('restore mongo', {
    script: path.resolve(__dirname, 'scripts/url_restore.sh'),
    vars: {
      url: vars.url,
      username: vars.db.username,
      password: vars.db.password
    }
  });

  return taskList;
};