#start mongodb
sudo start mongodb || :

PRIMARY_MONGO_HOST=""

function pickPrimary() {
  ADMIN_PASS=$1
  MAX_SECS=$2;
  if [[ -z $MAX_SECS ]]; then
    MAX_SECS=120
  fi

  while [[ true ]]; do
    if [[ $MAX_SECS == 0 ]]; then
      echo "could not found a PRIMARY" >&2;
      exit 1
    fi

    PRIMARY_MONGO_HOST=`mongo localhost/admin -u admin -p $ADMIN_PASS /tmp/pick_primary.js | tail -n 1`
    if [[ $PRIMARY_MONGO_HOST != "RETRY" ]]; then
      break
    fi
    sleep 1
    let MAX_SECS=$MAX_SECS-1;
  done
}

# wait for mongo for 10 minutes (need big time for journal setup and for pre-allocate)
wait-for-mongo mongodb://admin:<%= adminPass %>@localhost/admin  600000
pickPrimary <%= adminPass %>

mongo $PRIMARY_MONGO_HOST/admin -u admin -p <%= adminPass %> /tmp/set_users.js || exit 1
rm /tmp/pick_primary.js
rm /tmp/set_users.js
