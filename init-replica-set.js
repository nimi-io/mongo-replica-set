// This script will be executed when MongoDB starts
// It's mainly for database initialization, replica set init happens in start-replica.sh

print('MongoDB initialization script executed');

// Create a default database and collection if needed
db = db.getSiblingDB('admin');

// Create an application database
db = db.getSiblingDB('appdb');
db.createCollection('test');

print('Default database and collection created');
