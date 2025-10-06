const { MongoClient } = require('mongodb');

// Connect to primary node only for testing
const uri = 'mongodb://admin:password123@localhost:27017/?authSource=admin&directConnection=true';

class SimpleMongoTester {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB Primary Node...');
      this.client = new MongoClient(uri);
      await this.client.connect();
      
      this.db = this.client.db('test');
      this.collection = this.db.collection('users');
      
      console.log('✅ Connected successfully to MongoDB Primary');
      
      // Test basic connection
      const hello = await this.client.db('admin').command({ hello: 1 });
      console.log('📊 Server Info:', {
        isWritablePrimary: hello.isWritablePrimary,
        setName: hello.setName || 'standalone'
      });
      
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async testBasicOperations() {
    console.log('\n📝 Testing basic CRUD operations...');
    
    try {
      // Create
      const insertResult = await this.collection.insertOne({
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        tags: ['test', 'javascript'],
        testId: 'simple-test-' + Date.now()
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
            email: 'john.doe@example.com',
            updatedAt: new Date()
          },
          $push: { tags: 'updated' }
        }
      );
      console.log('✅ Update successful, modified:', updateResult.modifiedCount);

      // Read updated document
      const updatedUser = await this.collection.findOne({ _id: insertResult.insertedId });
      console.log('✅ Updated document:', {
        name: updatedUser.name,
        email: updatedUser.email,
        tags: updatedUser.tags
      });

      // Delete
    //   const deleteResult = await this.collection.deleteOne({ _id: insertResult.insertedId });
    //   console.log('✅ Delete successful, deleted:', deleteResult.deletedCount);

    } catch (error) {
      console.error('❌ CRUD operations failed:', error.message);
      throw error;
    }
  }

  async testChangeStreams() {
    console.log('\n👀 Testing Change Streams...');
    
    return new Promise((resolve, reject) => {
      try {
        // Set up change stream on the collection
        const changeStream = this.collection.watch([], {
          fullDocument: 'updateLookup'
        });
        
        let changesReceived = 0;
        const maxChanges = 3;

        console.log('🔄 Change stream is now listening...');

        changeStream.on('change', (change) => {
          changesReceived++;
          console.log(`📢 Change ${changesReceived} detected:`, {
            operationType: change.operationType,
            documentKey: change.documentKey?._id?.toString(),
            timestamp: new Date().toISOString()
          });

          if (change.fullDocument) {
            console.log('   Document:', {
              name: change.fullDocument.name,
              email: change.fullDocument.email
            });
          }

          if (changesReceived >= maxChanges) {
            console.log('✅ Change stream test completed');
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
              name: 'Alice Smith',
              email: 'alice@example.com',
              type: 'change-stream-test',
              createdAt: new Date()
            });

            setTimeout(async () => {
              // Update
              await this.collection.updateOne(
                { _id: doc1.insertedId },
                { $set: { email: 'alice.smith@example.com', updatedAt: new Date() } }
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

        // Timeout after 10 seconds
        setTimeout(() => {
          if (changesReceived < maxChanges) {
            console.log('⏰ Change stream test timed out');
            changeStream.close();
            resolve();
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Change stream setup failed:', error.message);
        reject(error);
      }
    });
  }

  async testBulkOperations() {
    console.log('\n📦 Testing bulk operations...');
    
    try {
      const users = [
        { name: 'User 1', email: 'user1@example.com', batch: 'bulk-test' },
        { name: 'User 2', email: 'user2@example.com', batch: 'bulk-test' },
        { name: 'User 3', email: 'user3@example.com', batch: 'bulk-test' }
      ];

      // Bulk insert
      const insertResult = await this.collection.insertMany(users);
      console.log('✅ Bulk insert successful:', insertResult.insertedCount, 'documents');

      // Bulk update
      const updateResult = await this.collection.updateMany(
        { batch: 'bulk-test' },
        { $set: { bulkUpdated: true, updatedAt: new Date() } }
      );
      console.log('✅ Bulk update successful:', updateResult.modifiedCount, 'documents');

      // Count documents
      const count = await this.collection.countDocuments({ batch: 'bulk-test' });
      console.log('✅ Document count:', count);

      // Cleanup
      const deleteResult = await this.collection.deleteMany({ batch: 'bulk-test' });
      console.log('✅ Bulk delete successful:', deleteResult.deletedCount, 'documents');

    } catch (error) {
      console.error('❌ Bulk operations failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('👋 Disconnected from MongoDB');
    }
  }

  async runAllTests() {
    try {
      await this.connect();
      await this.testBasicOperations();
      await this.testBulkOperations();
      await this.testChangeStreams();
      
      console.log('\n🎉 All tests completed successfully!');
      
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
  const tester = new SimpleMongoTester();
  tester.runAllTests().then(() => {
    console.log('✨ MongoDB test completed');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleMongoTester;