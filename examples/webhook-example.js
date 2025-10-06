const { MongoClient } = require('mongodb');
const axios = require('axios');

const uri = 'mongodb://admin:password123@localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0&authSource=admin';

// Configure your webhook URL here
const WEBHOOK_URL = 'http://localhost:5678/webhook/mongodb-change';

class WebhookMongoWatcher {
  constructor(webhookUrl = WEBHOOK_URL) {
    this.webhookUrl = webhookUrl;
    this.client = new MongoClient(uri);
    this.changeStream = null;
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('🔌 Connected to MongoDB Replica Set');
      
      const db = this.client.db('testdb');
      const collection = db.collection('users');
      
      // Set up change stream with options
      this.changeStream = collection.watch([], {
        fullDocument: 'updateLookup',
        fullDocumentBeforeChange: 'whenAvailable'
      });
      
      console.log(`📡 Watching for changes and sending to: ${this.webhookUrl}`);
      console.log('👀 Change stream is active...');
      
    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw error;
    }
  }

  async startWatching() {
    if (!this.changeStream) {
      throw new Error('Not connected. Call connect() first.');
    }

    this.changeStream.on('change', async (change) => {
      console.log('🔔 Change detected:', change.operationType);
      
      try {
        // Prepare webhook payload
        const payload = {
          timestamp: new Date().toISOString(),
          operationType: change.operationType,
          documentKey: change.documentKey,
          fullDocument: change.fullDocument,
          fullDocumentBeforeChange: change.fullDocumentBeforeChange,
          updateDescription: change.updateDescription,
          clusterTime: change.clusterTime
        };

        // Send to webhook
        const response = await axios.post(this.webhookUrl, payload, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'MongoDB-ChangeStream-Webhook/1.0'
          }
        });

        console.log('✅ Webhook sent successfully:', {
          status: response.status,
          operation: change.operationType,
          documentId: change.documentKey?._id
        });

      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          console.error('🔌 Webhook endpoint not available:', this.webhookUrl);
        } else if (error.response) {
          console.error('❌ Webhook failed:', {
            status: error.response.status,
            data: error.response.data
          });
        } else {
          console.error('❌ Webhook error:', error.message);
        }
      }
    });

    this.changeStream.on('error', (error) => {
      console.error('💥 Change stream error:', error);
    });

    // Keep process running
    process.on('SIGINT', async () => {
      await this.stop();
    });
  }

  async stop() {
    console.log('\n🛑 Stopping webhook watcher...');
    
    if (this.changeStream) {
      await this.changeStream.close();
    }
    
    if (this.client) {
      await this.client.close();
    }
    
    console.log('👋 Webhook watcher stopped');
    process.exit(0);
  }

  // Test method to generate sample data
  async generateTestData() {
    try {
      const db = this.client.db('testdb');
      const collection = db.collection('users');
      
      console.log('🧪 Generating test data...');
      
      // Insert
      const user = await collection.insertOne({
        name: 'Webhook Test User',
        email: 'webhook@example.com',
        createdAt: new Date(),
        type: 'webhook-test'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update
      await collection.updateOne(
        { _id: user.insertedId },
        { 
          $set: { 
            email: 'webhook.updated@example.com',
            updatedAt: new Date()
          } 
        }
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Delete
      await collection.deleteOne({ _id: user.insertedId });
      
      console.log('✅ Test data generation completed');
      
    } catch (error) {
      console.error('❌ Test data generation failed:', error);
    }
  }
}

// Main execution
async function main() {
  const watcher = new WebhookMongoWatcher(process.env.WEBHOOK_URL || WEBHOOK_URL);
  
  try {
    await watcher.connect();
    await watcher.startWatching();
    
    // Optional: Generate test data after 3 seconds
    setTimeout(async () => {
      console.log('\n🎯 Generating test data in 3 seconds...');
      await watcher.generateTestData();
    }, 3000);
    
  } catch (error) {
    console.error('💥 Failed to start webhook watcher:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  console.log('🚀 MongoDB Webhook Watcher Starting...');
  console.log('💡 Set WEBHOOK_URL environment variable to customize webhook endpoint');
  console.log(`📡 Current webhook URL: ${process.env.WEBHOOK_URL || WEBHOOK_URL}`);
  console.log('');
  
  main();
}

module.exports = WebhookMongoWatcher;