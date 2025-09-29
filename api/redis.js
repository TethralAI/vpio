const Redis = require('ioredis');

class DataStore {
  constructor() {
    this.redis = null;
    this.connected = false;
    this.memoryStore = new Map();
    this.memoryExpiry = new Map();

    this.initialize();
  }

  async initialize() {
    try {
      // Try to connect to Redis if URL is provided
      if (process.env.REDIS_URL) {
        console.log('🔄 Connecting to Redis...');
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });

        // Test connection
        await this.redis.ping();
        this.connected = true;
        console.log('✅ Redis connected successfully');

        // Handle connection events
        this.redis.on('error', (err) => {
          console.log('❌ Redis connection error:', err.message);
          this.connected = false;
        });

        this.redis.on('connect', () => {
          console.log('🔗 Redis reconnected');
          this.connected = true;
        });

      } else {
        console.log('⚠️  No REDIS_URL provided, using memory store');
      }
    } catch (error) {
      console.log('❌ Redis connection failed, using memory store:', error.message);
      this.connected = false;
    }

    // Initialize default API keys if Redis is available
    if (this.connected) {
      await this.initializeAPIKeys();
    }

    // Clean up expired memory entries every 5 minutes
    setInterval(() => this.cleanupMemoryExpiry(), 5 * 60 * 1000);
  }

  async initializeAPIKeys() {
    try {
      const existingKeys = await this.redis.smembers('api_keys');

      if (existingKeys.length === 0) {
        // Initialize with default API keys
        const defaultKeys = [
          'vpio-test-key-1',
          'vpio-test-key-2',
          'vpio-test-key-3',
          'vpio-demo-key'
        ];

        for (const key of defaultKeys) {
          await this.redis.sadd('api_keys', key);
        }
        console.log('✅ Default API keys initialized in Redis');
      }
    } catch (error) {
      console.log('❌ Error initializing API keys:', error.message);
    }
  }

  cleanupMemoryExpiry() {
    const now = Date.now();
    for (const [key, expiry] of this.memoryExpiry) {
      if (now > expiry) {
        this.memoryStore.delete(key);
        this.memoryExpiry.delete(key);
      }
    }
  }

  async set(key, value, expirySeconds = null) {
    try {
      const jsonValue = JSON.stringify(value);

      if (this.connected) {
        if (expirySeconds) {
          await this.redis.setex(key, expirySeconds, jsonValue);
        } else {
          await this.redis.set(key, jsonValue);
        }
        return true;
      } else {
        // Fallback to memory
        this.memoryStore.set(key, jsonValue);
        if (expirySeconds) {
          this.memoryExpiry.set(key, Date.now() + (expirySeconds * 1000));
        }
        return true;
      }
    } catch (error) {
      console.log('❌ Error setting data:', error.message);
      // Fallback to memory even if Redis fails
      this.memoryStore.set(key, JSON.stringify(value));
      if (expirySeconds) {
        this.memoryExpiry.set(key, Date.now() + (expirySeconds * 1000));
      }
      return false;
    }
  }

  async get(key) {
    try {
      let value = null;

      if (this.connected) {
        value = await this.redis.get(key);
      } else {
        // Check memory store
        if (this.memoryExpiry.has(key) && Date.now() > this.memoryExpiry.get(key)) {
          // Expired
          this.memoryStore.delete(key);
          this.memoryExpiry.delete(key);
          return null;
        }
        value = this.memoryStore.get(key);
      }

      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.log('❌ Error getting data:', error.message);
      return null;
    }
  }

  async delete(key) {
    try {
      if (this.connected) {
        await this.redis.del(key);
      } else {
        this.memoryStore.delete(key);
        this.memoryExpiry.delete(key);
      }
      return true;
    } catch (error) {
      console.log('❌ Error deleting data:', error.message);
      return false;
    }
  }

  async exists(key) {
    try {
      if (this.connected) {
        return await this.redis.exists(key) === 1;
      } else {
        if (this.memoryExpiry.has(key) && Date.now() > this.memoryExpiry.get(key)) {
          this.memoryStore.delete(key);
          this.memoryExpiry.delete(key);
          return false;
        }
        return this.memoryStore.has(key);
      }
    } catch (error) {
      console.log('❌ Error checking existence:', error.message);
      return false;
    }
  }

  async getKeys(pattern) {
    try {
      if (this.connected) {
        return await this.redis.keys(pattern);
      } else {
        // Simple pattern matching for memory store
        const keys = Array.from(this.memoryStore.keys());
        if (pattern === '*') return keys;

        // Basic wildcard support
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return keys.filter(key => regex.test(key));
      }
    } catch (error) {
      console.log('❌ Error getting keys:', error.message);
      return [];
    }
  }

  // API Key management
  async addAPIKey(apiKey) {
    try {
      if (this.connected) {
        await this.redis.sadd('api_keys', apiKey);
        return true;
      } else {
        // Store in memory as a set
        let apiKeys = this.memoryStore.get('api_keys');
        if (!apiKeys) {
          apiKeys = JSON.stringify([]);
        }
        const keys = JSON.parse(apiKeys);
        if (!keys.includes(apiKey)) {
          keys.push(apiKey);
          this.memoryStore.set('api_keys', JSON.stringify(keys));
        }
        return true;
      }
    } catch (error) {
      console.log('❌ Error adding API key:', error.message);
      return false;
    }
  }

  async removeAPIKey(apiKey) {
    try {
      if (this.connected) {
        await this.redis.srem('api_keys', apiKey);
        return true;
      } else {
        let apiKeys = this.memoryStore.get('api_keys');
        if (apiKeys) {
          const keys = JSON.parse(apiKeys);
          const index = keys.indexOf(apiKey);
          if (index > -1) {
            keys.splice(index, 1);
            this.memoryStore.set('api_keys', JSON.stringify(keys));
          }
        }
        return true;
      }
    } catch (error) {
      console.log('❌ Error removing API key:', error.message);
      return false;
    }
  }

  async isValidAPIKey(apiKey) {
    try {
      if (this.connected) {
        return await this.redis.sismember('api_keys', apiKey) === 1;
      } else {
        const apiKeys = this.memoryStore.get('api_keys');
        if (!apiKeys) {
          // Initialize default keys if not present
          const defaultKeys = ['vpio-test-key-1', 'vpio-test-key-2', 'vpio-test-key-3', 'vpio-demo-key'];
          this.memoryStore.set('api_keys', JSON.stringify(defaultKeys));
          return defaultKeys.includes(apiKey);
        }
        const keys = JSON.parse(apiKeys);
        return keys.includes(apiKey);
      }
    } catch (error) {
      console.log('❌ Error validating API key:', error.message);
      // Fallback to hardcoded keys
      const fallbackKeys = ['vpio-test-key-1', 'vpio-test-key-2', 'vpio-test-key-3', 'vpio-demo-key'];
      return fallbackKeys.includes(apiKey);
    }
  }

  async getAllAPIKeys() {
    try {
      if (this.connected) {
        return await this.redis.smembers('api_keys');
      } else {
        const apiKeys = this.memoryStore.get('api_keys');
        return apiKeys ? JSON.parse(apiKeys) : [];
      }
    } catch (error) {
      console.log('❌ Error getting API keys:', error.message);
      return [];
    }
  }

  getStatus() {
    return {
      redis_connected: this.connected,
      redis_url: process.env.REDIS_URL ? '✅ Set' : '❌ Not set',
      fallback_mode: !this.connected,
      memory_keys: this.memoryStore.size,
      memory_expiry_keys: this.memoryExpiry.size
    };
  }
}

// Export singleton instance
module.exports = new DataStore();