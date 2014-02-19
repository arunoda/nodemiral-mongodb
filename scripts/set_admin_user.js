var db = db.getSiblingDB('admin');
db.addUser({
  user: 'admin',
  pwd: '<%= adminPass %>',
  roles: ['clusterAdmin', 'userAdminAnyDatabase']
});
