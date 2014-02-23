set -e

mongo <%= dbHost %>/admin -u admin -p <%= adminPass %> /tmp/set_users.js || exit 1

rm /tmp/set_users.js