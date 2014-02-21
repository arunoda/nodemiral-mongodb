var status = rs.status();
if(status && status.members) {
  var primaryHost = null;
  
  for(var lc = 0; lc<status.members.length; lc++) {
    var member = status.members[lc];
    if(member.stateStr == 'PRIMARY') {
      primaryHost =  member.name;
      break;
    } 
  }

  print(primaryHost || 'RETRY');  
} else {
  print('RETRY');
}