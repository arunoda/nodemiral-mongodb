KEYFILE=/opt/nodemiral/mongodb/key_file

sudo echo <%= key %> | sudo tee $KEYFILE
sudo chmod 400 $KEYFILE
sudo chown mongodb $KEYFILE