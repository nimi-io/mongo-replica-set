# MongoDB Replica Set with Docker Compose

A simple and reliable MongoDB replica set setup using Docker Compose for local development and testing.

## Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd mongo-replica-set
   npm install
   ```

2. **Start the replica set:**
   ```bash
   ./setup.sh
   ```

3. **Test the connection:**
   ```bash
   npm start
   ```

## Files Overview

- `docker-compose.yml` - Docker Compose configuration for 3-node MongoDB replica set
- `setup.sh` - Automated setup script for initializing the replica set
- `connect.js` - Connection test script with CRUD operations
- `package.json` - Node.js dependencies and scripts

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   mongo1        │    │   mongo2        │    │   mongo3        │
│   (Primary)     │◄──►│   (Secondary)   │◄──►│   (Secondary)   │
│   Port: 27017   │    │   Port: 27018   │    │   Port: 27019   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

The replica set consists of:
- **mongo1**: Primary node (localhost:27017)
- **mongo2**: Secondary node (localhost:27018)  
- **mongo3**: Secondary node (localhost:27019)

## Connection String

```javascript
mongodb://localhost:27017,localhost:27018,localhost:27019/myapp?replicaSet=rs0
```

## Available Commands

- `npm start` - Test the MongoDB connection and run CRUD operations
- `./setup.sh` - Initialize and start the MongoDB replica set
- `docker compose up -d` - Start containers without initialization
- `docker compose down` - Stop and remove containers
- `docker compose down -v` - Stop containers and remove volumes (clean reset)

## Troubleshooting

If you encounter connection issues:

1. **Ensure containers are running:**
   ```bash
   docker ps
   ```

2. **Check replica set status:**
   ```bash
   docker exec mongo1 mongosh --eval "rs.status()"
   ```

3. **Reset everything:**
   ```bash
   docker compose down -v
   ./setup.sh
   ```

## Requirements

- Docker and Docker Compose
- Node.js (for testing)
- MongoDB shell (mongosh) - included in MongoDB Docker image

## License

MIT
