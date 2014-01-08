var knox = require('knox');
var client = knox.createClient({
  key: '<%= apiKey %>',
  secret: '<%= secret %>',
  bucket: '<%= bucket %>'
});

client.putFile('/tmp/mongodump.tar.gz', '/<%= id %>.tar.gz', { 'x-amz-acl': 'public-read' }, function(err, res){
  if(err) {
    console.error(err.message);
    process.exit(1);
  }
});

