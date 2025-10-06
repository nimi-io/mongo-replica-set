#!/bin/bash

# MongoDB Replica Set Test Script

echo "🧪 Testing MongoDB Replica Set..."

# Test 1: Check if all containers are running
echo "📦 Checking container status..."
RUNNING_CONTAINERS=$(docker ps --filter "name=mongo" --format "table {{.Names}}\t{{.Status}}" | grep -c "Up")
if [ "$RUNNING_CONTAINERS" -eq 3 ]; then
    echo "✅ All 3 MongoDB containers are running"
else
    echo "❌ Expected 3 containers, found $RUNNING_CONTAINERS running"
    docker ps --filter "name=mongo"
    exit 1
fi

# Test 2: Check replica set status
echo "🔍 Checking replica set status..."
RS_STATUS=$(docker exec mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.status().ok" --quiet 2>/dev/null)
if [ "$RS_STATUS" = "1" ]; then
    echo "✅ Replica set is healthy"
else
    echo "❌ Replica set status check failed"
    exit 1
fi

# Test 3: Check for PRIMARY node
echo "👑 Checking for PRIMARY node..."
PRIMARY_COUNT=$(docker exec mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.status().members.filter(m => m.stateStr === 'PRIMARY').length" --quiet 2>/dev/null)
if [ "$PRIMARY_COUNT" = "1" ]; then
    echo "✅ Found 1 PRIMARY node"
else
    echo "❌ Expected 1 PRIMARY node, found $PRIMARY_COUNT"
    exit 1
fi

# Test 4: Check SECONDARY nodes
echo "🔄 Checking for SECONDARY nodes..."
SECONDARY_COUNT=$(docker exec mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.status().members.filter(m => m.stateStr === 'SECONDARY').length" --quiet 2>/dev/null)
if [ "$SECONDARY_COUNT" = "2" ]; then
    echo "✅ Found 2 SECONDARY nodes"
else
    echo "❌ Expected 2 SECONDARY nodes, found $SECONDARY_COUNT"
    exit 1
fi

# Test 5: Test database operations
echo "💾 Testing database operations..."
docker exec mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "
use testdb
db.test.insertOne({ test: true, timestamp: new Date() })
const count = db.test.countDocuments({})
print('Documents in test collection: ' + count)
" --quiet > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database operations successful"
else
    echo "❌ Database operations failed"
    exit 1
fi

# Test 6: Test connection string
echo "🔗 Testing connection string..."
CONNECTION_TEST=$(docker exec mongo1 mongosh "mongodb://admin:password123@mongo1:27017,mongo2:27017,mongo3:27017/?replicaSet=rs0&authSource=admin" --eval "db.runCommand('hello').ok" --quiet 2>/dev/null)
if [ "$CONNECTION_TEST" = "1" ]; then
    echo "✅ Connection string works"
else
    echo "❌ Connection string test failed"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Your MongoDB Replica Set is working correctly."
echo ""
echo "📋 Connection Details:"
echo "   Connection String: mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&authSource=admin"
echo "   Primary: localhost:27017"
echo "   Secondary: localhost:27018, localhost:27019"
echo ""
echo "🚀 You can now:"
echo "   • Connect with MongoDB Compass"
echo "   • Use Change Streams"
echo "   • Run the test applications from the README"