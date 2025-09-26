#!/bin/bash

# MongoDB Replica Set Setup Script

echo "Starting MongoDB replica set containers..."
docker-compose up -d

echo "Waiting for MongoDB instances to start..."
sleep 10

echo "Initializing replica set..."
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017', priority: 2 },
    { _id: 1, host: 'mongo2:27017', priority: 1 },
    { _id: 2, host: 'mongo3:27017', priority: 1 }
  ]
})
"

echo "Waiting for replica set to be ready..."
sleep 15

echo "Checking replica set status..."
docker exec -it mongo1 mongosh --eval "rs.status()"

echo ""
echo "MongoDB Replica Set Setup Complete!"
echo ""
echo "Connection strings:"
echo "  Primary (mongo1): mongodb://localhost:27017/?replicaSet=rs0"
echo "  Replica Set: mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0"
echo ""
echo "To connect to the replica set:"
echo "  mongosh 'mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0'"
