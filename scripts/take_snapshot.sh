#!/bin/bash

# creating snapshot
sudo lvremove -f /dev/vgdata/snapdata || :
sudo lvcreate -n snapdata -s -l 20%VG /dev/vgdata/vol0
sudo mkdir -p /snapdata
sudo mount /dev/vgdata/snapdata /snapdata
cd /snapdata
tar czf /backup/backup-`date +'%Y_%m_%d_%H'`.tar.gz ./
cd /tmp
umount /snapdata
lvremove -f /dev/vgdata/snapdata

# delete older backups than 5 days
find /backup -mtime +<%= expireAfter %>  -exec rm {} \;