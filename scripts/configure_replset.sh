set -e

DB_HOST=<%= dbHost %>
#ensure db is started
sudo start mongod || :

wait-for-mongo mongodb://admin:<%= adminPass%>@$DB_HOST/admin

export LC_ALL=C
mongo $DB_HOST/admin -u admin -p <%= adminPass%> /tmp/configure_replset.js || exit 1
rm /tmp/configure_replset.js
