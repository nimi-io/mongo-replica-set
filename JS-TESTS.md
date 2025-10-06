# JavaScript Test Examples

This directory contains Node.js test scripts to verify your MongoDB replica set functionality.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the comprehensive test:**
   ```bash
   node test-mongodb-simple.js
   ```

## Available Tests

### `test-mongodb-simple.js`
- ✅ **Basic CRUD operations** (Create, Read, Update, Delete)
- ✅ **Bulk operations** (Insert/Update/Delete multiple documents)
- ✅ **Change Streams** (Real-time monitoring of database changes)
- ✅ **Connection verification** (Checks replica set status)

### `examples/change-stream-example.js`
Interactive change stream watcher:
```bash
node examples/change-stream-example.js
```
This will listen for changes indefinitely. Open another terminal and make database changes to see them in real-time.

### `examples/webhook-example.js`
Sends database changes to a webhook endpoint:
```bash
# Default webhook URL (http://localhost:5678/webhook/mongodb-change)
node examples/webhook-example.js

# Custom webhook URL
WEBHOOK_URL=https://your-webhook-url.com/endpoint node examples/webhook-example.js
```

## Test Results Example

```
🔌 Connecting to MongoDB Primary Node...
✅ Connected successfully to MongoDB Primary
📊 Server Info: { isWritablePrimary: true, setName: 'rs0' }

📝 Testing basic CRUD operations...
✅ Insert successful: 507f1f77bcf86cd799439011
✅ Read successful: John Doe
✅ Update successful, modified: 1
✅ Delete successful, deleted: 1

📦 Testing bulk operations...
✅ Bulk insert successful: 3 documents
✅ Bulk update successful: 3 documents
✅ Document count: 3
✅ Bulk delete successful: 3 documents

👀 Testing Change Streams...
🔄 Change stream is now listening...
📢 Change 1 detected: { operationType: 'insert', ... }
📢 Change 2 detected: { operationType: 'update', ... }
📢 Change 3 detected: { operationType: 'delete', ... }
✅ Change stream test completed

🎉 All tests completed successfully!
```

## Connection Details

The tests use this connection configuration:
- **Primary Connection**: `mongodb://admin:password123@localhost:27017/?authSource=admin&directConnection=true`
- **Replica Set Connection**: `mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&authSource=admin`

## What Each Test Validates

1. **Connection Test**: Verifies MongoDB is accessible and authenticated
2. **CRUD Operations**: Tests basic database operations work correctly
3. **Bulk Operations**: Validates performance with multiple documents
4. **Change Streams**: Confirms real-time change detection is working
5. **Replica Set Status**: Checks that the replica set is healthy

## Integration Examples

These examples show how to:
- Monitor database changes in real-time
- Send changes to external webhooks (perfect for n8n integration)
- Handle authentication with replica sets
- Work with MongoDB from Node.js applications

## Troubleshooting

If tests fail:
1. Ensure MongoDB replica set is running: `docker ps`
2. Check replica set status: `./test-replica-set.sh`
3. Verify connection manually: `docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin`