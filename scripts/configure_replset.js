var existingConf = null;

try {
  existingConf = rs.conf();
} catch(ex) {
  existingConf = null;
}

var status;
if(existingConf) {
  existingConf.members = <%- JSON.stringify(members) %>;
  status = rs.reconfig(existingConf, {force: true});
} else {
  status = rs.initiate({
    _id: "<%= replSet %>",
    members: <%- JSON.stringify(members) %>
  });
}

if(!status.ok) {
  printjson(status);
  throw new Error("replSet initiatialization failed!");
}