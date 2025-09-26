# MongoDB Replica Set for Railway

A MongoDB replica set configuration optimized for Railway deployment.

## Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

## Files Overview

- `Dockerfile` - MongoDB container configuration
- `railway.json` - Railway deployment configuration  
- `init-replica-set.js` - MongoDB initialization script
- `RAILWAY_DEPLOYMENT.md` - Complete deployment guide

## Deployment

See [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) for detailed instructions on deploying a 3-node MongoDB replica set on Railway.

## Environment Variables

Each MongoDB instance requires:
- `MONGO_NODE_ID` - Node identifier (0, 1, 2)
- `MONGO_HOST` - Hostname for this instance
- `MONGO_REPLICA_SET` - Replica set name (default: rs0)
- `MONGO_PORT` - Port number (default: 27017)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   mongo1        │    │   mongo2        │    │   mongo3        │
│   (Primary)     │◄──►│   (Secondary)   │◄──►│   (Secondary)   │
│   Port: 27017   │    │   Port: 27017   │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

Each service runs independently on Railway with internal networking.
