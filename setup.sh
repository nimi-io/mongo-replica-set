#!/bin/bash

echo "Starting MongoDB replica set..."
docker compose up -d

echo "Waiting for containers to start..."
sleep 10

echo "Initializing replica set..."
docker exec mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017' },
    { _id: 1, host: 'mongo2:27017' },
    { _id: 2, host: 'mongo3:27017' }
  ]
})
"

echo "Waiting for replica set to stabilize..."
sleep 15

echo "Replica set status:"
docker exec mongo1 mongosh --eval "rs.status().members.forEach(m => print(m.name + ': ' + m.stateStr))"

echo ""
echo "✅ MongoDB replica set is ready!"
echo "Connect with: mongosh 'mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0'"
