#!/bin/bash

set -e

REMOTE_USERNAME="root"
REMOTE_HOST="49.235.241.244"

echo "Signing in to server..."

ssh -tt -i ~/.ssh/id_rsa_travis $REMOTE_USERNAME@$REMOTE_HOST << EOF
cd /usr/share/nginx/html/web/node-static-server && git pull && rm -rf node_modules && yarn --registry=https://registry.npm.taobao.org
pm2 delete node-static-server
pm2 start app.js --name node-static-server

exit
EOF
