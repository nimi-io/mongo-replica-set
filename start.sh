#!/bin/bash

# MongoDB Replica Set Startup Script

echo "🚀 Starting MongoDB Replica Set..."

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down

# Start the services
echo "📦 Starting containers..."
docker-compose up -d

echo "⏳ Waiting for containers to be ready..."
sleep 10

# Check container status
echo "📊 Container status:"
docker-compose ps

echo ""
echo "🔍 Waiting for replica set initialization..."
echo "This may take up to 2 minutes..."

# Wait for replica set initialization
timeout=120
counter=0
echo "🔄 Checking replica set status..."

while [ $counter -lt $timeout ]; do
    # First check if mongo1 is responding
    if docker exec mongo1 mongosh --eval "db.runCommand('hello')" --quiet > /dev/null 2>&1; then
        echo ""
        echo "📡 MongoDB is responding, checking replica set..."
        
        # Try to check replica set status with authentication
        if docker exec mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "rs.status()" --quiet > /dev/null 2>&1; then
            echo "✅ Replica set initialized and authenticated successfully!"
            break
        else
            # If authentication fails, try to create admin user
            echo "🔑 Creating admin user..."
            if docker exec mongo1 mongosh --eval "
                try {
                    db.getSiblingDB('admin').createUser({
                        user: 'admin',
                        pwd: 'password123',
                        roles: [{ role: 'root', db: 'admin' }]
                    });
                    print('Admin user created');
                } catch(e) {
                    print('User exists or other error: ' + e);
                }
            " --quiet > /dev/null 2>&1; then
                echo "✅ Admin user setup completed"
            fi
        fi
    fi
    echo -n "."
    sleep 5
    counter=$((counter + 5))
done

if [ $counter -ge $timeout ]; then
    echo ""
    echo "❌ Timeout waiting for replica set initialization"
    echo "🔍 Checking container logs..."
    docker-compose logs --tail=10 mongo1
    echo ""
    echo "🛠️  Manual troubleshooting:"
    echo "   Check logs: docker-compose logs -f"
    echo "   Check status: docker exec -it mongo1 mongosh --eval 'rs.status()'"
    exit 1
fi

# Final verification
echo ""
echo "🧪 Running final verification..."
if docker exec mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval "
    const status = rs.status();
    const primary = status.members.find(m => m.stateStr === 'PRIMARY');
    const secondaries = status.members.filter(m => m.stateStr === 'SECONDARY');
    print('Primary: ' + (primary ? primary.name : 'NONE'));
    print('Secondaries: ' + secondaries.length);
    if (!primary) { throw new Error('No primary found'); }
" --quiet; then
    echo "✅ Replica set verification passed!"
else
    echo "⚠️  Replica set may not be fully initialized, but containers are running"
fi

echo ""
echo "🎉 MongoDB Replica Set is ready!"
echo "📋 Connection details:"
echo "   Connection String: mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&authSource=admin"
echo "   Primary: localhost:27017"
echo "   Secondary: localhost:27018, localhost:27019"
echo ""
echo "🔧 Useful commands:"
echo "   Check status: docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin --eval 'rs.status()' --quiet"
echo "   Connect to shell: docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin"
echo "   Run tests: node test-mongodb-simple.js"
echo "   View logs: docker-compose logs -f"
echo "   Stop: docker-compose down"
echo ""
echo "🧪 Quick test:"
echo "   Run './test-replica-set.sh' for comprehensive testing"