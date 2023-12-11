#!/bin/bash

MYSQL_USER="root"
MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-changeme}"

while true; do
  mysqladmin ping -h $MYSQL_HOST -p$MYSQL_ROOT_PASSWORD -u $MYSQL_USER

  if [ $? -eq 0 ]; then
    echo "MySQL connection successful. Running $@"
    break
  else
    echo "MySQL connection failed. Retrying in 5 seconds..."
    sleep 5
  fi
done

exec "$@"
