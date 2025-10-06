const { MongoClient } = require('mongodb');

// For change streams, we need to use directConnection to avoid hostname resolution issues
// This works fine for change streams on a single node or when connecting to the primary
const uri = 'mongodb://admin:password123@localhost:27017/?authSource=admin&directConnection=true';

// If you want to use full replica set connection (requires hostname resolution):
// const uri = 'mongodb://admin:password123@localhost:27017/?replicaSet=rs0&authSource=admin';

async function watchChangeStream() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB Replica Set');
    
    const db = client.db('testdb');
    const collection = db.collection('users');
    
    // Create the collection if it doesn't exist
    await collection.createIndex({ email: 1 });
    console.log('📋 Collection ready');
    
    // Set up change stream
    const changeStream = collection.watch([], {
      fullDocument: 'updateLookup'
    });
    
    console.log('👀 Watching for changes... (Press Ctrl+C to stop)');
    console.log('💡 Open another terminal and run some MongoDB operations to see changes');
    console.log('   Example: docker exec -it mongo1 mongosh -u admin -p password123 --authenticationDatabase admin');
    console.log('   Then: use testdb; db.users.insertOne({name: "Test", email: "test@example.com"})');
    console.log('');
    
    changeStream.on('change', (change) => {
      console.log('🔔 Change detected:', {
        operationType: change.operationType,
        timestamp: new Date().toISOString(),
        documentKey: change.documentKey,
        ...(change.fullDocument && { document: change.fullDocument })
      });
      console.log('---');
    });
    
    changeStream.on('error', (error) => {
      console.error('❌ Change stream error:', error);
    });

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n👋 Closing change stream...');
      await changeStream.close();
      await client.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Error:', error);
    await client.close();
    process.exit(1);
  }
}

watchChangeStream();