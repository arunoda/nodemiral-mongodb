## Make this script idempotant in a better way
## Current it's an ad-hoc way of ignoring errors and checking it at the end
## We need to do it in incremental manner

DATA_DISK=<%= dataDisk%>
BACKUP_DISK=<%= backupDisk%>

set -e

sudo pvcreate $DATA_DISK || :
sudo pvcreate $BACKUP_DISK || :

sudo vgcreate vgdata $DATA_DISK || :
sudo vgcreate vgbackup $BACKUP_DISK || :

## CREATE DATA DIR
sudo lvcreate -n vol0 -l 80%VG /dev/vgdata || : # other 20% is for the snapshots
sudo mkfs.ext4 /dev/vgdata/vol0 || : 

## CREATE BACKUP DIR
sudo lvcreate -n vol0 -l 100%VG /dev/vgbackup || :
sudo mkfs.ext4 /dev/vgbackup/vol0 || :

## Mounting
sudo mkdir -p /data
sudo rm -rf /data/lost+found
sudo mkdir -p /backup
sudo rm -rf /backup/lost+found

## Add mount points
echo mount /dev/vgdata/vol0 /data > /tmp/rc.local
echo mount /dev/vgbackup/vol0 /backup >> /tmp/rc.local
sudo mv /tmp/rc.local /etc/rc.local

## Do the initial mounting
sudo bash /etc/rc.local || :

dataDiskMounted=`df | grep /data`
if [[ $dataDiskMounted == "" ]]; then
  >&2 echo "Data disk is not mounted. Please check."
  exit 1
fi

backupDiskMounted=`df | grep /backup`
if [[ $backupDiskMounted == "" ]]; then
  >&2 echo "BackupDisk disk is not mounted. Please check."
  exit 1
fi