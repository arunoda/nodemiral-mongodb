var BASE_DB = db;

<% users.forEach(function(user){ %>
    createUser('<%= user.username %>', '<%= user.db %>', '<%= user.password %>', <%- JSON.stringify(user.roles) %>);
<% }) %>

function createUser(username, dbname, password, roles) {
  var db = BASE_DB.getSiblingDB(dbname);
  db.removeUser(username);
  db.addUser({
    user: username,
    pwd : password,
    roles: roles
  });
}