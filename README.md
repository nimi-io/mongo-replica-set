# MongoDB Replica Set with n8n - Setup Guide

## Quick Start

### 1. Start the containers

```bash
docker-compose up -d
```

### 2. Wait for replica set initialization (about 30 seconds)

```bash
docker-compose logs -f mongo1
```

Wait until you see: `"Initiated replica set"`

### 3. Verify replica set status

```bash
docker exec -it mongo1 mongosh --eval "rs.status()" --quiet
```

You should see one PRIMARY and two SECONDARY nodes.

## Access Details

### MongoDB

- **Connection String**: `mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&authSource=admin`
- **Primary Node**: `localhost:27017` (mongo1)
- **Secondary Nodes**: `localhost:27018` (mongo2), `localhost:27019` (mongo3)
- **Username**: `admin`
- **Password**: `password123`

**Note**: All MongoDB instances run on port 27017 internally, but are exposed on different host ports (27017, 27018, 27019).

## Testing Change Streams

### 1. Connect to MongoDB

```bash
docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin
```

### 2. Create a test database and collection

```javascript
use testdb
db.createCollection("users")
```

### 3. Open a Change Stream (in one terminal)

```javascript
const changeStream = db.users.watch();
changeStream.on("change", (change) => {
  printjson(change);
});
```

### 4. Make changes (in another terminal)

```bash
docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin
```

```javascript
use testdb
db.users.insertOne({ name: "John Doe", email: "john@example.com", createdAt: new Date() })
db.users.updateOne({ name: "John Doe" }, { $set: { email: "newemail@example.com" } })
db.users.deleteOne({ name: "John Doe" })
```

You should see change events in the first terminal!

## Using Change Streams in Your Application

```javascript
// watch-mongodb.js
const { MongoClient } = require("mongodb");
const axios = require("axios");

const uri =
  "mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&authSource=admin";
const n8nWebhookUrl = "http://localhost:5678/webhook/mongodb-change";

async function watchCollection() {
  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db("testdb");
  const collection = db.collection("users");

  const changeStream = collection.watch();

  console.log("Watching for changes...");

  changeStream.on("change", async (change) => {
    console.log("Change detected:", change);

    try {
      await axios.post(n8nWebhookUrl, {
        operationType: change.operationType,
        documentKey: change.documentKey,
        fullDocument: change.fullDocument,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error sending to n8n:", error.message);
    }
  });
}

watchCollection().catch(console.error);
```

2. Run the script:

```bash
npm install mongodb axios
node watch-mongodb.js
```

### Option 2: Polling Method (Direct in n8n)

Use the workflow I provided earlier with these MongoDB credentials.

## Useful Commands

### View logs

```bash
docker-compose logs -f mongo1
```

### Stop services

```bash
docker-compose down
```

### Stop and remove volumes (clean slate)

```bash
docker-compose down -v
```

### Connect to MongoDB shell

```bash
docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin
```

### Check replica set configuration

```bash
docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.conf()"
```

### Check replica set status

```bash
docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.status()"
```

## Troubleshooting

### Replica set not initializing

```bash
docker exec -it mongo1 mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1:27017' },
    { _id: 1, host: 'mongo2:27017' },
    { _id: 2, host: 'mongo3:27017' }
  ]
})
"
```

### No PRIMARY node (all SECONDARY)

```bash
# Create admin user first
docker exec -it mongo1 mongosh --eval "
db.getSiblingDB('admin').createUser({
  user: 'admin',
  pwd: 'password123',
  roles: [{ role: 'root', db: 'admin' }]
})
"

# Force primary election
docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.stepUp()"
```

### Authentication failed

```bash
# Create the admin user without authentication
docker exec -it mongo1 mongosh --eval "
db.getSiblingDB('admin').createUser({
  user: 'admin',
  pwd: 'password123',
  roles: [{ role: 'root', db: 'admin' }]
})
"
```

### Check if containers are running

```bash
docker ps
```

### Restart a specific service

```bash
docker-compose restart mongo1
```

## Production Considerations

For production use:

1. Change default passwords
2. Enable SSL/TLS
3. Configure proper authentication
4. Set up backup strategies
5. Use persistent volumes on reliable storage
6. Configure resource limits
7. Set up monitoring and alerting

## Next Steps

1. Test the Change Streams with one of the code examples above
2. Integrate Change Streams into your application
3. Set up proper error handling and reconnection logic
4. Consider filtering change streams for specific operations or fields
