#!/bin/bash
set -e

## Check previous DB existance

MONGO_DIR=/opt/nodemiral/mongodb
DB_PATH=<%= dbpath %>
sudo mkdir -p $DB_PATH

#donot proceed if, data directory is not empty
if [ "$(ls -A $DB_PATH)" != "" ]; then
    echo "dbpath($DB_PATH) is not empty" >&2;
    exit 1
fi

#remove the lock
set +e
sudo dpkg --configure -a
sudo rm /var/lib/dpkg/lock > /dev/null
sudo rm /var/cache/apt/archives/lock > /dev/null
set -e

#fixing locale issue
sudo apt-get update -y
sudo apt-get install language-pack-en-base -y
sudo dpkg-reconfigure locales

cat >> ~/.profile << EOF
# Fix for locale issues when connecting to AWS Ubuntu instances over SSH
export LANG="en_GB.utf-8"
export LANGUAGE="en_GB.utf-8"
export LC_ALL="en_GB.utf-8"
EOF

source ~/.profile || :
MONGO_VERSION=<%= version %>

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo apt-get update -y

sudo apt-get install -y --force-yes \
  mongodb-org=$MONGO_VERSION \
  mongodb-org-server=$MONGO_VERSION \
  mongodb-org-shell=$MONGO_VERSION \
  mongodb-org-mongos=$MONGO_VERSION \
  mongodb-org-tools=$MONGO_VERSION

# hold the mongodb at 2.6
echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-org-shell hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections

#set db permissions
sudo chown -R mongodb $MONGO_DIR

# delete data directory
sudo stop mongod || :

# install nodejs
ARCH=`uname -m`
NODE_VERSION=0.10.28
if [[ $ARCH == 'x86_64' ]]; then
  NODE_ARCH=x64
else
  NODE_ARCH=x86
fi

sudo apt-get -y install build-essential libssl-dev git curl

cd /tmp
wget http://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$NODE_ARCH.tar.gz
tar xvzf node-v$NODE_VERSION-linux-$NODE_ARCH.tar.gz
sudo rm -rf /opt/nodejs
sudo mv node-v$NODE_VERSION-linux-$NODE_ARCH /opt/nodejs

sudo ln -sf /opt/nodejs/bin/node /usr/bin/node
sudo ln -sf /opt/nodejs/bin/npm /usr/bin/npm

#install npm tools
sudo npm install -g wait-for-mongo

#initial permission
sudo chown -R $USER /etc/init

sudo touch /etc/mongodb.conf
sudo chown $USER /etc/mongodb.conf
