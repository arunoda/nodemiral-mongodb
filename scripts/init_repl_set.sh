#!/bin/bash

set -e

#start mongodb
sudo stop mongodb
sudo start mongodb
wait-for-mongo mongodb://admin:<%= adminPass%>@127.0.0.1/admin

mongo 127.0.0.1/admin -u admin -p <%= adminPass%> /tmp/init_repl_set.js
rm /tmp/init_repl_set.js
