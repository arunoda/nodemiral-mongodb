var BASE_DB = db;

<% users.forEach(function(user){ %>
    createUser('<%= user.username %>', '<%= user.db %>', '<%= user.password %>', <%- JSON.stringify(user.roles) %>);
<% }) %>

function createUser(username, dbname, password, roles) {
  var db = BASE_DB.getSiblingDB(dbname);
  var user = db.getUser(username);
  if(!user) {
    db.createUser({
      user: username,
      pwd : password,
      roles: roles
    });
  } else {
    db.updateUser(username, {
      pwd : password,
      roles: roles
    });
  }
}
