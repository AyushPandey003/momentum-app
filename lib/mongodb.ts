// MongoDB Connection for Analytics Events
// This is separate from your Postgres DB to handle high-volume analytics writes

import { MongoClient, Db, Collection } from 'mongodb';
import type { AnalyticsEvent } from './analytics-types';

// Singleton pattern for MongoDB connection
class MongoDBConnection {
  private static instance: MongoDBConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private constructor() {}

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error(
        'MONGODB_URI environment variable is not set. ' +
        'Please add it to your .env file for analytics data collection.'
      );
    }

    try {
      this.client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
      });

      await this.client.connect();
      this.db = this.client.db('momentum_analytics');
      
      console.log('✅ MongoDB Analytics Connection established');
      
      // Create indexes on first connection
      await this.createIndexes();
      
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB Connection Error:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    const eventsCollection = this.db.collection('analytics_events');
    
    try {
      // Index for querying by user
      await eventsCollection.createIndex({ userId: 1, timestamp: -1 });
      
      // Index for querying by event type
      await eventsCollection.createIndex({ event_type: 1, timestamp: -1 });
      
      // Index for finding interventions and their feedback
      await eventsCollection.createIndex({ 'event_data.intervention_id': 1 });
      
      // Index for task-specific queries
      await eventsCollection.createIndex({ 'event_data.task_id': 1, timestamp: -1 });
      
      // TTL index - automatically delete events older than 2 years (for GDPR compliance)
      await eventsCollection.createIndex(
        { timestamp: 1 },
        { expireAfterSeconds: 63072000 } // 2 years
      );
      
      console.log('✅ MongoDB indexes created successfully');
    } catch (error) {
      console.error('Warning: Could not create indexes:', error);
    }
  }

  public async getCollection(): Promise<Collection<AnalyticsEvent>> {
    const db = await this.connect();
    return db.collection<AnalyticsEvent>('analytics_events');
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('MongoDB connection closed');
    }
  }

  // Health check
  public async ping(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.connect();
      }
      await this.client?.db().admin().ping();
      return true;
    } catch (error) {
      console.error('MongoDB ping failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mongodb = MongoDBConnection.getInstance();

// Helper function for getting the collection
export async function getAnalyticsCollection(): Promise<Collection<AnalyticsEvent>> {
  return mongodb.getCollection();
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await mongodb.close();
    process.exit(0);
  });
}
