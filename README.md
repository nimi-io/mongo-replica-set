# MongoDB Replica Set

This repository contains a complete MongoDB replica set setup using Docker Compose with 3 MongoDB instances.

## Quick Start

1. **Start the replica set:**
   ```bash
   ./setup.sh
   ```

2. **Connect to the replica set:**
   ```bash
   mongosh 'mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0'
   ```

3. **Clean up (stop containers and remove data):**
   ```bash
   ./cleanup.sh
   ```

## Manual Setup

If you prefer to run commands manually:

1. **Start containers:**
   ```bash
   docker-compose up -d
   ```

2. **Initialize replica set:**
   ```bash
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
   ```

3. **Check status:**
   ```bash
   docker exec -it mongo1 mongosh --eval "rs.status()"
   ```

## Configuration

- **mongo1** (Primary): `localhost:27017`
- **mongo2** (Secondary): `localhost:27018`
- **mongo3** (Secondary): `localhost:27019`
- **Replica Set Name**: `rs0`

## Connection Strings

- **Direct connection to primary**: `mongodb://localhost:27017/?replicaSet=rs0`
- **Full replica set**: `mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0`

## Data Persistence

Data is persisted in Docker volumes:
- `mongo1_data`
- `mongo2_data`
- `mongo3_data`

To completely remove all data, use the `cleanup.sh` script.

## Requirements

- Docker
- Docker Compose
- MongoDB Shell (mongosh) - for manual connections

## Testing the Replica Set

Once initialized, you can test the replica set functionality:

```javascript
// Connect to the replica set
use testdb

// Insert some test data
db.testcollection.insertOne({name: "test", timestamp: new Date()})

// Verify replication by connecting to different nodes
// The data should be available on all secondary nodes
```

## Troubleshooting

- If initialization fails, wait a bit longer for all containers to be ready
- Check container logs: `docker-compose logs <service_name>`
- Ensure no other MongoDB instances are running on ports 27017-27019
