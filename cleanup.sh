#!/bin/bash

# MongoDB Replica Set Cleanup Script

echo "Stopping and removing MongoDB containers..."
docker-compose down

echo "Removing MongoDB data volumes..."
docker volume rm mongo-replica-set_mongo1_data mongo-replica-set_mongo2_data mongo-replica-set_mongo3_data 2>/dev/null || echo "Some volumes may not exist yet"

echo "Cleanup-complete!"
