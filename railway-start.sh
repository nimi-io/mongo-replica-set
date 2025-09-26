#!/bin/bash
set -e

# Start MongoDB
if [ -n "$MONGODB_ROOT_PASSWORD" ]; then
    echo "Starting MongoDB with authentication..."
    mongod --auth --bind_ip_all &
else
    echo "Starting MongoDB without authentication..."
    mongod --bind_ip_all &
fi

MONGO_PID=$!

# Wait for MongoDB to start
echo "Waiting for MongoDB to start..."
until mongosh --quiet --eval "db.hello().ismaster !== undefined" > /dev/null 2>&1; do
    sleep 2
done

echo "MongoDB is ready"

# Create user if credentials provided
if [ -n "$MONGODB_ROOT_PASSWORD" ] && [ -n "$MONGODB_USERNAME" ] && [ -n "$MONGODB_PASSWORD" ]; then
    echo "Creating database user..."
    mongosh admin --eval "
        db.createUser({
            user: '$MONGODB_USERNAME',
            pwd: '$MONGODB_PASSWORD',
            roles: [{ role: 'readWrite', db: '$MONGODB_DATABASE' }]
        })
    "
fi

# Keep container running
wait $MONGO_PID
