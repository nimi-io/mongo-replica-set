# Railway Deployment Guide

This guide explains how to deploy the MongoDB Replica Set to Railway.

## Important Notes

⚠️ **Railway Limitations**: Railway's current infrastructure has some limitations for MongoDB replica sets:

1. **Internal Networking**: Railway services communicate via internal hostnames, which works well for replica sets
2. **Persistent Storage**: Railway provides persistent volumes for data storage
3. **Port Exposure**: Only one service can expose external ports per project

## Deployment Options

### Option 1: Single MongoDB Instance (Recommended for Railway)

For production use on Railway, consider using a single MongoDB instance with Railway's built-in backup and scaling features:

```dockerfile
FROM mongo:6.0

# Set environment variables
ENV MONGODB_ROOT_PASSWORD=${MONGODB_ROOT_PASSWORD}
ENV MONGODB_USERNAME=${MONGODB_USERNAME}
ENV MONGODB_PASSWORD=${MONGODB_PASSWORD}
ENV MONGODB_DATABASE=${MONGODB_DATABASE}

# Expose port
EXPOSE 27017

# Use default MongoDB startup
CMD ["mongod", "--bind_ip_all"]
```

### Option 2: Custom Replica Set (Advanced)

If you need a true replica set on Railway:

1. **Deploy as separate Railway services**:
   - Create 3 separate Railway services
   - Each service uses the same Dockerfile
   - Configure environment variables for each service

2. **Environment Variables per Service**:

   **Service 1 (Primary)**:
   ```
   REPLICA_SET_MEMBER=primary
   MONGO_PRIMARY_HOST=mongodb-primary.railway.internal
   MONGO_SECONDARY1_HOST=mongodb-secondary1.railway.internal
   MONGO_SECONDARY2_HOST=mongodb-secondary2.railway.internal
   ```

   **Service 2 (Secondary 1)**:
   ```
   REPLICA_SET_MEMBER=secondary
   MONGO_PRIMARY_HOST=mongodb-primary.railway.internal
   MONGO_SECONDARY1_HOST=mongodb-secondary1.railway.internal
   MONGO_SECONDARY2_HOST=mongodb-secondary2.railway.internal
   ```

   **Service 3 (Secondary 2)**:
   ```
   REPLICA_SET_MEMBER=secondary
   MONGO_PRIMARY_HOST=mongodb-primary.railway.internal
   MONGO_SECONDARY1_HOST=mongodb-secondary1.railway.internal
   MONGO_SECONDARY2_HOST=mongodb-secondary2.railway.internal
   ```

## Quick Railway Deployment Steps

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial MongoDB replica set setup"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Connect to Railway**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository
   - Select "Deploy from GitHub repo"

3. **Configure Environment Variables** (in Railway dashboard):
   ```
   REPLICA_SET_MEMBER=primary
   MONGO_PRIMARY_HOST=mongodb-primary.railway.internal
   MONGO_SECONDARY1_HOST=mongodb-secondary1.railway.internal  
   MONGO_SECONDARY2_HOST=mongodb-secondary2.railway.internal
   ```

4. **Deploy**: Railway will automatically build and deploy using the Dockerfile

## Connection String for Railway

Once deployed, use Railway's provided URL:
```
mongodb://<railway-service-url>:27017/your-database?retryWrites=true&w=majority
```

## Alternative: MongoDB Atlas

For production MongoDB clusters, consider MongoDB Atlas, which provides:
- Built-in replica sets
- Automated backups
- Monitoring and alerts
- Global clusters
- Free tier available

Railway works excellently with MongoDB Atlas as an external database service.

## Environment Variables

Set these in your Railway service:

- `MONGODB_ROOT_PASSWORD`: Root password for MongoDB
- `MONGODB_USERNAME`: Application username
- `MONGODB_PASSWORD`: Application password
- `MONGODB_DATABASE`: Default database name
- `REPLICA_SET_MEMBER`: 'primary' or 'secondary'
- `MONGO_PRIMARY_HOST`: Hostname of primary MongoDB instance
- `MONGO_SECONDARY1_HOST`: Hostname of first secondary
- `MONGO_SECONDARY2_HOST`: Hostname of second secondary

## Monitoring

Railway provides built-in monitoring for:
- CPU usage
- Memory usage
- Network I/O
- Logs

Access these through the Railway dashboard after deployment.
