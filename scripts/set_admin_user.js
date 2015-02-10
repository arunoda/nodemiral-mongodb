var db = db.getSiblingDB('admin');
var userExists = db.getUser('admin');

if(!userExists) {
  db.createUser({
    user: 'admin',
    pwd: '<%= adminPass %>',
    roles: ['clusterAdmin', 'userAdminAnyDatabase', 'dbAdmin', 'userAdmin', 'readWriteAnyDatabase', 'dbAdminAnyDatabase']
  });
} else {
  db.updateUser("admin", {
    pwd: '<%= adminPass %>',
    roles: ['clusterAdmin', 'userAdminAnyDatabase', 'dbAdmin', 'userAdmin', 'readWriteAnyDatabase', 'dbAdminAnyDatabase']
  });
}
