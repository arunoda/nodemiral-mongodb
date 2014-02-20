#!/bin/bash

# wait for mongo for 10 minutes (need big time for journal setup and for pre-allocate)
wait-for-mongo mongodb://localhost:27017/admin 600000

mongo /tmp/set_admin_user.js || exit 1
rm /tmp/set_admin_user.js