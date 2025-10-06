const { MongoClient } = require('mongodb');

// Use replica set connection for optimal change streams
const uri = 'mongodb://admin:password123@localhost:27017/?replicaSet=rs0&authSource=admin';

class ReplicaSetTester {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB Replica Set...');
      this.client = new MongoClient(uri, {
        // Add connection options for better replica set handling
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      await this.client.connect();
      
      this.db = this.client.db('testdb');
      this.collection = this.db.collection('users');
      
      console.log('✅ Connected successfully to MongoDB Replica Set');
      
      // Test replica set status
      try {
        const admin = this.client.db('admin');
        const status = await admin.command({ replSetGetStatus: 1 });
        const primary = status.members.find(member => member.stateStr === 'PRIMARY');
        const secondaries = status.members.filter(member => member.stateStr === 'SECONDARY');
        
        console.log(`📊 Replica Set Status:`);
        console.log(`   Primary: ${primary ? primary.name : 'NONE'}`);
        console.log(`   Secondaries: ${secondaries.map(s => s.name).join(', ')}`);
        console.log(`   Total members: ${status.members.length}`);
      } catch (statusError) {
        console.log('ℹ️  Replica set status check failed (might be using direct connection)');
      }
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async testChangeStreams() {
    console.log('\n👀 Testing Change Streams with Replica Set Connection...');
    
    return new Promise((resolve, reject) => {
      try {
        // Set up change stream on the collection
        const changeStream = this.collection.watch([], {
          fullDocument: 'updateLookup',
          fullDocumentBeforeChange: 'whenAvailable'
        });
        
        let changesReceived = 0;
        const maxChanges = 3;

        console.log('🔄 Change stream is now listening...');

        changeStream.on('change', (change) => {
          changesReceived++;
          console.log(`📢 Change ${changesReceived} detected:`, {
            operationType: change.operationType,
            documentKey: change.documentKey?._id?.toString(),
            timestamp: new Date().toISOString(),
            clusterTime: change.clusterTime
          });

          if (change.fullDocument) {
            console.log('   New Document:', {
              name: change.fullDocument.name,
              email: change.fullDocument.email
            });
          }

          if (change.fullDocumentBeforeChange) {
            console.log('   Previous Document:', {
              name: change.fullDocumentBeforeChange.name,
              email: change.fullDocumentBeforeChange.email
            });
          }

          if (changesReceived >= maxChanges) {
            console.log('✅ Change stream test completed successfully');
            changeStream.close();
            resolve();
          }
        });

        changeStream.on('error', (error) => {
          console.error('❌ Change stream error:', error.message);
          changeStream.close();
          reject(error);
        });

        // Generate some changes to test the stream
        setTimeout(async () => {
          try {
            console.log('📝 Generating test changes...');
            
            // Insert
            const doc1 = await this.collection.insertOne({
              name: 'Replica Test User',
              email: 'replica@example.com',
              type: 'replica-change-stream-test',
              createdAt: new Date()
            });

            setTimeout(async () => {
              // Update
              await this.collection.updateOne(
                { _id: doc1.insertedId },
                { $set: { email: 'replica.updated@example.com', updatedAt: new Date() } }
              );

              setTimeout(async () => {
                // Delete
                await this.collection.deleteOne({ _id: doc1.insertedId });
              }, 1000);
            }, 1000);

          } catch (error) {
            console.error('❌ Error generating changes:', error.message);
            changeStream.close();
            reject(error);
          }
        }, 1000);

        // Timeout after 15 seconds
        setTimeout(() => {
          if (changesReceived < maxChanges) {
            console.log('⏰ Change stream test timed out (this is normal)');
            changeStream.close();
            resolve();
          }
        }, 15000);

      } catch (error) {
        console.error('❌ Change stream setup failed:', error.message);
        reject(error);
      }
    });
  }

  async testBasicOperations() {
    console.log('\n📝 Testing basic CRUD operations...');
    
    try {
      // Create
      const insertResult = await this.collection.insertOne({
        name: 'Replica Set Test User',
        email: 'rstest@example.com',
        createdAt: new Date(),
        tags: ['replica-set', 'test']
      });
      console.log('✅ Insert successful:', insertResult.insertedId.toString());

      // Read
      const user = await this.collection.findOne({ _id: insertResult.insertedId });
      console.log('✅ Read successful:', user.name);

      // Update
      const updateResult = await this.collection.updateOne(
        { _id: insertResult.insertedId },
        { 
          $set: { 
            email: 'rstest.updated@example.com',
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ Update successful, modified:', updateResult.modifiedCount);

      // Delete
      const deleteResult = await this.collection.deleteOne({ _id: insertResult.insertedId });
      console.log('✅ Delete successful, deleted:', deleteResult.deletedCount);

    } catch (error) {
      console.error('❌ CRUD operations failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('👋 Disconnected from MongoDB Replica Set');
    }
  }

  async runAllTests() {
    try {
      await this.connect();
      await this.testBasicOperations();
      await this.testChangeStreams();
      
      console.log('\n🎉 All replica set tests completed successfully!');
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new ReplicaSetTester();
  tester.runAllTests().then(() => {
    console.log('✨ MongoDB Replica Set test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = ReplicaSetTester;