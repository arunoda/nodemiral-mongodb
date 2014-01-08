#start mongodb
sudo start mongodb || :

function waitForMaster() {
  ADMIN_PASS=$1
  MAX_SECS=$2;
  if [[ -z $MAX_SECS ]]; then
    MAX_SECS=120
  fi

  while [[ true ]]; do
    if [[ $MAX_SECS == 0 ]]; then
      echo "mongod never became master" >&2;
      exit 1
    fi

    MONGO=`mongo localhost/admin -u admin -p $ADMIN_PASS --eval "db.isMaster().ismaster" | grep true`
    if [[ $MONGO ]]; then
      break
    fi
    sleep 1
    let MAX_SECS=$MAX_SECS-1;
  done
}

# wait for mongo for 10 minutes (need big time for journal setup and for pre-allocate)
wait-for-mongo mongodb://admin:<%= adminPass %>@localhost/admin  600000
waitForMaster <%= adminPass %>

mongo localhost/admin -u admin -p <%= adminPass %> <%= script %> || exit 1
rm <%= script %>
