set -e

#ensure db is started
sudo start mongodb || :

wait-for-mongo mongodb://admin:<%= adminPass%>@127.0.0.1/admin

mongo 127.0.0.1/admin -u admin -p <%= adminPass%> /tmp/configure_replset.js || exit 1
rm /tmp/configure_replset.js
