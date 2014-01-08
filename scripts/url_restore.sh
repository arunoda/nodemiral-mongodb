#!/bin/bash

# this needs some stuff required for an tty, that' why we need this
# following script fix some locale based issue for mongo
set +e
source ~/.profile 2> /dev/null
set -e

cd /tmp

#downloading
OUTPUT_FILENAME=mongodump_to_restore
wget -O $OUTPUT_FILENAME <%- url %>

#restoring
tar xf $OUTPUT_FILENAME
mongorestore -d app -u <%- username %> -p <%- password %> dump/app

#cleanup
rm $OUTPUT_FILENAME
rm -rf dump
