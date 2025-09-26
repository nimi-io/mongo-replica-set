# MongoDB Replica Set on Railway

This guide explains how to deploy a MongoDB replica set on Railway using multiple services.

## Railway Deployment Architecture

Railway requires each MongoDB instance to be deployed as a separate service. Each service will:
- Run on port 27017 internally (MongoDB default)
- Get assigned a unique public URL by Railway
- Communicate with other services via Railway's internal networking

## Step-by-Step Deployment

### 1. Create Three Services

You need to create **three separate services** in your Railway project:

1. **mongo1** (Primary)
2. **mongo2** (Secondary) 
3. **mongo3** (Secondary)

### 2. Deploy Each Service

For each service, deploy this same repository but with different environment variables:

#### Service: mongo1 (Primary)
```bash
MONGO_NODE_ID=0
MONGO_HOST=mongo1
MONGO_PORT=27017
MONGO_REPLICA_SET=rs0
MONGO_PRIORITY=2
```

#### Service: mongo2 (Secondary)
```bash
MONGO_NODE_ID=1
MONGO_HOST=mongo2
MONGO_PORT=27017
MONGO_REPLICA_SET=rs0
MONGO_PRIORITY=1
```

#### Service: mongo3 (Secondary)
```bash
MONGO_NODE_ID=2
MONGO_HOST=mongo3
MONGO_PORT=27017
MONGO_REPLICA_SET=rs0
MONGO_PRIORITY=1
```

### 3. Configure Internal URLs

After deployment, Railway will provide internal URLs for each service:
- `mongo1.railway.internal:27017`
- `mongo2.railway.internal:27017`
- `mongo3.railway.internal:27017`

### 4. Initialize Replica Set

Connect to the primary service (mongo1) and run:

```javascript
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongo1.railway.internal:27017', priority: 2 },
    { _id: 1, host: 'mongo2.railway.internal:27017', priority: 1 },
    { _id: 2, host: 'mongo3.railway.internal:27017', priority: 1 }
  ]
})
```

## Port Configuration

Each MongoDB service uses:
- **Internal Port**: 27017 (MongoDB default)
- **External Port**: Assigned by Railway (varies)
- **Replica Communication**: via Railway's internal networking on port 27017

## Connection Strings

### From External Applications
```
mongodb://mongo1-production.up.railway.app:PORT,mongo2-production.up.railway.app:PORT,mongo3-production.up.railway.app:PORT/?replicaSet=rs0
```

### From Internal Services (within Railway)
```
mongodb://mongo1.railway.internal:27017,mongo2.railway.internal:27017,mongo3.railway.internal:27017/?replicaSet=rs0
```

## Important Notes

1. **Data Persistence**: Railway provides ephemeral storage. For production, consider using Railway's PostgreSQL or external MongoDB Atlas.

2. **Networking**: Railway handles internal DNS resolution between services automatically.

3. **Scaling**: Each service can be scaled independently, but replica set members should remain stable.

4. **Security**: Use Railway's environment variables for sensitive configuration.

## Alternative: MongoDB Atlas

For production workloads, consider using MongoDB Atlas (cloud-hosted) instead of self-hosted replica sets on Railway, as it provides:
- Automatic scaling and backups
- Professional monitoring
- Better data persistence guarantees
- Built-in security features
