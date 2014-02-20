var status = rs.status();

var existingConf = rs.conf();

if(existingConf) {
  existingConf.members = <%- JSON.stringify(members) %>;
  rs.reconfig(existingConf, {force: true});
} else {
  rs.initiate({
    _id: "<%= replSet %>",
    members: <%- JSON.stringify(members) %>
  });
}