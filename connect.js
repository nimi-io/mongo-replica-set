const mongoose = require('mongoose');

// MongoDB replica set connection string - connect to primary first
const mongoURI = 'mongodb://localhost:27017,localhost:27018,localhost:27019/myapp?replicaSet=rs0';

// Connection options for replica set
const replicaSetOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Reduced timeout for faster fallback
  connectTimeoutMS: 5000,
  directConnection: false, // Ensure we're connecting as a replica set
};

// Connection options for direct connection
const directOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  directConnection: true, // Direct connection to single node
};

// Connect to MongoDB replica set
async function connectToMongoDB() {
  try {
    console.log('🔄 Attempting replica set connection...');
    await mongoose.connect(mongoURI, replicaSetOptions);
    console.log('✅ Connected to MongoDB replica set successfully!');
    
    // Test the connection with a simple operation
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // Check if we're connected to the replica set
    const isMaster = await adminDb.command({ isMaster: 1 });
    console.log('🔗 Connected to:', isMaster.me);
    console.log('📊 Replica set:', isMaster.setName || 'None (direct connection)');
    console.log('👑 Is primary:', isMaster.ismaster);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error connecting to replica set:', error.message);
    
    // Try connecting directly to primary
    console.log('🔄 Trying direct connection to primary...');
    try {
      const directURI = 'mongodb://localhost:27017/myapp';
      await mongoose.connect(directURI, directOptions);
      console.log('✅ Connected directly to primary node');
      
      // Test the direct connection
      const db = mongoose.connection.db;
      const adminDb = db.admin();
      const isMaster = await adminDb.command({ isMaster: 1 });
      console.log('🔗 Connected to:', isMaster.me);
      console.log('📊 Replica set:', isMaster.setName || 'None (direct connection)');
      console.log('👑 Is primary:', isMaster.ismaster);
      
      return true;
      
    } catch (directError) {
      console.error('❌ Direct connection also failed:', directError.message);
      throw new Error('Unable to connect to MongoDB using either replica set or direct connection');
    }
  }
}

// Define a simple schema for testing
const testSchema = new mongoose.Schema({
  name: String,
  timestamp: { type: Date, default: Date.now }
});

const TestModel = mongoose.model('Test', testSchema);

// Test CRUD operations
async function testOperations() {
  try {
    console.log('\n🧪 Testing CRUD operations...');
    
    // Create
    const doc = new TestModel({ name: 'Test Document' });
    await doc.save();
    console.log('✅ Document created:', doc._id);

    // Read
    const found = await TestModel.findById(doc._id);
    console.log('📖 Document found:', found.name);

    // Update
    found.name = 'Updated Document';
    await found.save();
    console.log('✏️ Document updated');

    // Count documents
    const count = await TestModel.countDocuments();
    console.log('📊 Total documents:', count);

    // Delete
    await TestModel.findByIdAndDelete(doc._id);
    console.log('🗑️ Document deleted');

  } catch (error) {
    console.error('❌ Error in operations:', error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting MongoDB connection test...\n');
  
  await connectToMongoDB();
  await testOperations();
  
  console.log('\n👋 Closing connection...');
  await mongoose.connection.close();
  console.log('✅ Connection closed successfully');
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { connectToMongoDB, TestModel };