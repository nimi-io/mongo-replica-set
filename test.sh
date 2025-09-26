#!/bin/bash

# Test script for MongoDB Replica Set

echo "Testing MongoDB Replica Set..."
echo ""

# Test connection to primary
echo "1. Testing connection to primary (mongo1)..."
docker exec -it mongo1 mongosh --quiet --eval "
db.hello().ismaster ? 
  print('✅ Connected to PRIMARY successfully') : 
  print('❌ Failed to connect to primary')
"

echo ""

# Test replica set status
echo "2. Checking replica set status..."
docker exec -it mongo1 mongosh --quiet --eval "
const status = rs.status();
print('Replica Set Name:', status.set);
print('Number of members:', status.members.length);
status.members.forEach(member => {
  print(' -', member.name, ':', member.stateStr);
});
"

echo ""

# Test data insertion and replication
echo "3. Testing data insertion and replication..."
docker exec -it mongo1 mongosh --quiet --eval "
use testdb;
const result = db.testcollection.insertOne({
  message: 'Test data for replication',
  timestamp: new Date(),
  testId: Math.random()
});
print('✅ Inserted document with ID:', result.insertedId);
"

sleep 2

echo ""
echo "4. Verifying data replication on secondary nodes..."

# Check on mongo2
docker exec -it mongo2 mongosh --quiet --eval "
db.getMongo().setReadPref('secondary');
use testdb;
const count = db.testcollection.countDocuments({message: 'Test data for replication'});
count > 0 ? 
  print('✅ Data replicated to mongo2') : 
  print('❌ Data not found on mongo2');
"

# Check on mongo3
docker exec -it mongo3 mongosh --quiet --eval "
db.getMongo().setReadPref('secondary');
use testdb;
const count = db.testcollection.countDocuments({message: 'Test data for replication'});
count > 0 ? 
  print('✅ Data replicated to mongo3') : 
  print('❌ Data not found on mongo3');
"

echo ""
echo "5. Cleaning up test data..."
docker exec -it mongo1 mongosh --quiet --eval "
use testdb;
db.testcollection.deleteMany({message: 'Test data for replication'});
print('✅ Test data cleaned up');
"

echo ""
echo "Replica set test completed!"
