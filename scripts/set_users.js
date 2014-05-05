var BASE_DB = db;

<% users.forEach(function(user){ %>
    createUser('<%= user.username %>', '<%= user.db %>', '<%= user.password %>', <%- JSON.stringify(user.roles) %>);
<% }) %>

function createUser(username, dbname, password, roles) {
  var db = BASE_DB.getSiblingDB(dbname);
  db.dropUser(username);
  db.createUser({
    user: username,
    pwd : password,
    roles: roles
  });
}