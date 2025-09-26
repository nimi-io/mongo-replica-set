#!/bin/bash

# Start MongoDB in background
mongod --replSet rs0 --bind_ip_all --port 27017 &

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
until mongosh --quiet --eval 'db.hello().ismaster !== undefined' > /dev/null 2>&1; do
  echo "MongoDB not ready yet, waiting..."
  sleep 2
done

echo "MongoDB is ready"

# Initialize replica set if this is the primary node
if [ "$REPLICA_SET_MEMBER" = "primary" ]; then
  echo "Initializing replica set..."
  mongosh --eval "
    try {
      const config = {
        _id: 'rs0',
        members: [
          { _id: 0, host: process.env.MONGO_PRIMARY_HOST + ':27017', priority: 2 },
          { _id: 1, host: process.env.MONGO_SECONDARY1_HOST + ':27017', priority: 1 },
          { _id: 2, host: process.env.MONGO_SECONDARY2_HOST + ':27017', priority: 1 }
        ]
      };
      
      const result = rs.initiate(config);
      print('Replica set initialization result:', JSON.stringify(result, null, 2));
    } catch(e) {
      print('Error or replica set already initialized:', e.message);
    }
  "
fi

# Keep the container running and MongoDB in foreground
wait
