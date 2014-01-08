#!/bin/bash

# this needs some stuff required for an tty, that' why we need this
# following script fix some locale based issue for mongo
set +e
source ~/.profile 2> /dev/null
set -e

cd /tmp
rm -rf dump
rm -rf mongodump.tar.gz

mongodump -d app -u <%= username %> -p <%= password %> 
#no need to backup system.users.collection
rm dump/app/system.users.*
tar cvzf mongodump.tar.gz dump

npm install knox
node s3_backup.js
rm s3_backup.js