# MongoDB Data Modeling and Scaling Strategies

## Overview

MongoDB data modeling strategies and scaling patterns for high-performance applications.

## Document Design Patterns

### 1. Embedding vs Referencing

#### When to Embed Documents

```javascript
// E-commerce Product with Reviews (One-to-Few relationship)
const productSchema = {
  _id: ObjectId("..."),
  name: "MacBook Pro",
  price: 1999,
  category: "Electronics",
  specifications: {
    processor: "M2 Pro",
    memory: "16GB",
    storage: "512GB"
  },
  reviews: [ // Embed when < 100 reviews per product
    {
      _id: ObjectId("..."),
      userId: ObjectId("..."),
      rating: 5,
      comment: "Excellent laptop!",
      createdAt: ISODate("2023-01-15")
    },
    {
      _id: ObjectId("..."),
      userId: ObjectId("..."),
      rating: 4,
      comment: "Great performance",
      createdAt: ISODate("2023-01-20")
    }
  ],
  averageRating: 4.5,
  totalReviews: 2
};

// Node.js implementation
class ProductService {
  constructor(db) {
    this.collection = db.collection('products');
  }
  
  async addReview(productId, reviewData) {
    const review = {
      _id: new ObjectId(),
      userId: new ObjectId(reviewData.userId),
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date()
    };
    
    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $push: { reviews: review },
        $inc: { totalReviews: 1 }
      }
    );
    
    // Recalculate average rating
    await this.updateAverageRating(productId);
    
    return review;
  }
  
  async updateAverageRating(productId) {
    const [result] = await this.collection.aggregate([
      { $match: { _id: new ObjectId(productId) } },
      { $unwind: "$reviews" },
      { $group: {
        _id: "$_id",
        averageRating: { $avg: "$reviews.rating" }
      }}
    ]).toArray();
    
    if (result) {
      await this.collection.updateOne(
        { _id: new ObjectId(productId) },
        { $set: { averageRating: Math.round(result.averageRating * 10) / 10 } }
      );
    }
  }
}
```

#### When to Reference Documents

```javascript
// Blog System (One-to-Many relationship with many comments)
const blogPostSchema = {
  _id: ObjectId("..."),
  title: "MongoDB Best Practices",
  content: "...",
  authorId: ObjectId("..."), // Reference to User
  tags: ["mongodb", "database", "nosql"],
  publishedAt: ISODate("2023-01-15"),
  stats: {
    views: 1500,
    likes: 45,
    commentCount: 234 // Maintain count for performance
  }
};

const commentSchema = {
  _id: ObjectId("..."),
  postId: ObjectId("..."), // Reference to BlogPost
  userId: ObjectId("..."), // Reference to User
  content: "Great article!",
  parentId: ObjectId("..."), // For threaded comments (optional)
  createdAt: ISODate("2023-01-16"),
  likes: 12
};

// Node.js implementation with aggregation
class BlogService {
  constructor(db) {
    this.posts = db.collection('posts');
    this.comments = db.collection('comments');
    this.users = db.collection('users');
  }
  
  async getPostWithComments(postId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    // Get post with author info
    const [post] = await this.posts.aggregate([
      { $match: { _id: new ObjectId(postId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            { $project: { name: 1, avatar: 1 } }
          ]
        }
      },
      { $unwind: '$author' }
    ]).toArray();
    
    if (!post) throw new Error('Post not found');
    
    // Get comments with pagination
    const comments = await this.comments.aggregate([
      { $match: { postId: new ObjectId(postId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { name: 1, avatar: 1 } }
          ]
        }
      },
      { $unwind: '$user' }
    ]).toArray();
    
    return {
      ...post,
      comments,
      pagination: {
        page,
        limit,
        total: post.stats.commentCount,
        hasMore: skip + limit < post.stats.commentCount
      }
    };
  }
  
  async addComment(postId, userId, content) {
    const comment = {
      _id: new ObjectId(),
      postId: new ObjectId(postId),
      userId: new ObjectId(userId),
      content,
      createdAt: new Date(),
      likes: 0
    };
    
    // Insert comment and update post stats atomically
    const session = this.posts.client.startSession();
    
    try {
      await session.withTransaction(async () => {
        await this.comments.insertOne(comment, { session });
        await this.posts.updateOne(
          { _id: new ObjectId(postId) },
          { $inc: { 'stats.commentCount': 1 } },
          { session }
        );
      });
      
      return comment;
    } finally {
      await session.endSession();
    }
  }
}
```

### 2. Polymorphic Schema Pattern

```javascript
// Content Management System with different content types
const contentBaseSchema = {
  _id: ObjectId("..."),
  type: "article", // Discriminator field
  title: "How to Scale MongoDB",
  authorId: ObjectId("..."),
  publishedAt: ISODate("2023-01-15"),
  tags: ["mongodb", "scaling"],
  status: "published"
};

// Article content
const articleSchema = {
  ...contentBaseSchema,
  type: "article",
  body: "Article content here...",
  readingTime: 5, // minutes
  tableOfContents: [
    { title: "Introduction", anchor: "#intro" },
    { title: "Scaling Strategies", anchor: "#scaling" }
  ]
};

// Video content
const videoSchema = {
  ...contentBaseSchema,
  type: "video",
  videoUrl: "https://youtube.com/watch?v=...",
  duration: 1200, // seconds
  transcript: "Video transcript...",
  thumbnailUrl: "https://img.youtube.com/..."
};

// Podcast content
const podcastSchema = {
  ...contentBaseSchema,
  type: "podcast",
  audioUrl: "https://podcast.com/episode.mp3",
  duration: 3600,
  showNotes: "Episode notes...",
  guestSpeakers: [
    { name: "John Doe", bio: "MongoDB Expert" }
  ]
};

// Content service with polymorphic handling
class ContentService {
  constructor(db) {
    this.collection = db.collection('content');
  }
  
  async getContentByType(type, filters = {}, options = {}) {
    const query = { type, ...filters };
    
    return await this.collection
      .find(query, options)
      .sort({ publishedAt: -1 })
      .toArray();
  }
  
  async createContent(contentData) {
    const content = {
      _id: new ObjectId(),
      ...contentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Type-specific validation
    switch (content.type) {
      case 'article':
        this.validateArticle(content);
        break;
      case 'video':
        this.validateVideo(content);
        break;
      case 'podcast':
        this.validatePodcast(content);
        break;
      default:
        throw new Error(`Unsupported content type: ${content.type}`);
    }
    
    await this.collection.insertOne(content);
    return content;
  }
  
  validateArticle(content) {
    if (!content.body) throw new Error('Article body is required');
    if (!content.readingTime) {
      // Calculate reading time (average 200 words per minute)
      const wordCount = content.body.split(' ').length;
      content.readingTime = Math.ceil(wordCount / 200);
    }
  }
  
  validateVideo(content) {
    if (!content.videoUrl) throw new Error('Video URL is required');
    if (!content.duration) throw new Error('Video duration is required');
  }
  
  validatePodcast(content) {
    if (!content.audioUrl) throw new Error('Audio URL is required');
    if (!content.duration) throw new Error('Podcast duration is required');
  }
}
```

## Advanced Query Patterns

### 1. Aggregation Pipeline Patterns

```javascript
// Complex analytics aggregation
class AnalyticsService {
  constructor(db) {
    this.orders = db.collection('orders');
    this.products = db.collection('products');
    this.users = db.collection('users');
  }
  
  async getSalesAnalytics(startDate, endDate) {
    return await this.orders.aggregate([
      // Match date range
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'completed'
        }
      },
      
      // Unwind order items
      { $unwind: '$items' },
      
      // Lookup product information
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo',
          pipeline: [
            { $project: { name: 1, category: 1, price: 1 } }
          ]
        }
      },
      { $unwind: '$productInfo' },
      
      // Lookup user information
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo',
          pipeline: [
            { $project: { name: 1, email: 1, segment: 1 } }
          ]
        }
      },
      { $unwind: '$userInfo' },
      
      // Add calculated fields
      {
        $addFields: {
          itemRevenue: { $multiply: ['$items.quantity', '$items.price'] },
          month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          dayOfWeek: { $dayOfWeek: '$createdAt' }
        }
      },
      
      // Group by multiple dimensions
      {
        $group: {
          _id: {
            month: '$month',
            category: '$productInfo.category',
            userSegment: '$userInfo.segment'
          },
          totalRevenue: { $sum: '$itemRevenue' },
          totalQuantity: { $sum: '$items.quantity' },
          uniqueCustomers: { $addToSet: '$userId' },
          averageOrderValue: { $avg: '$totalAmount' },
          topProducts: {
            $push: {
              productId: '$items.productId',
              productName: '$productInfo.name',
              quantity: '$items.quantity',
              revenue: '$itemRevenue'
            }
          }
        }
      },
      
      // Add customer count
      {
        $addFields: {
          customerCount: { $size: '$uniqueCustomers' }
        }
      },
      
      // Sort top products within each group
      {
        $addFields: {
          topProducts: {
            $slice: [
              {
                $sortArray: {
                  input: '$topProducts',
                  sortBy: { revenue: -1 }
                }
              },
              5
            ]
          }
        }
      },
      
      // Final sort
      { $sort: { '_id.month': -1, totalRevenue: -1 } }
    ]).toArray();
  }
  
  async getCustomerLifetimeValue(userId) {
    const [result] = await this.orders.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' },
          firstOrder: { $min: '$createdAt' },
          lastOrder: { $max: '$createdAt' },
          ordersByStatus: {
            $push: {
              status: '$status',
              amount: '$totalAmount',
              date: '$createdAt'
            }
          }
        }
      },
      {
        $addFields: {
          daysSinceFirstOrder: {
            $divide: [
              { $subtract: [new Date(), '$firstOrder'] },
              1000 * 60 * 60 * 24
            ]
          },
          purchaseFrequency: {
            $divide: ['$totalOrders', {
              $max: [1, {
                $divide: [
                  { $subtract: ['$lastOrder', '$firstOrder'] },
                  1000 * 60 * 60 * 24
                ]
              }]
            }]
          }
        }
      }
    ]).toArray();
    
    return result;
  }
}
```

### 2. Text Search and Autocomplete

```javascript
class SearchService {
  constructor(db) {
    this.products = db.collection('products');
    this.setupTextIndex();
  }
  
  async setupTextIndex() {
    // Create compound text index
    await this.products.createIndex({
      name: 'text',
      description: 'text',
      'category.name': 'text',
      tags: 'text'
    }, {
      weights: {
        name: 10,
        'category.name': 5,
        description: 2,
        tags: 1
      },
      name: 'product_text_search'
    });
    
    // Create autocomplete index for product names
    await this.products.createIndex({
      'autoComplete.name': 1
    });
  }
  
  async searchProducts(query, filters = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      category,
      priceRange,
      inStock
    } = options;
    
    const skip = (page - 1) * limit;
    const pipeline = [];
    
    // Text search stage
    if (query) {
      pipeline.push({
        $match: {
          $text: { $search: query }
        }
      });
      
      // Add text score for relevance sorting
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }
    
    // Apply filters
    const matchFilters = {};
    
    if (category) {
      matchFilters['category.name'] = category;
    }
    
    if (priceRange) {
      matchFilters.price = {
        $gte: priceRange.min,
        $lte: priceRange.max
      };
    }
    
    if (inStock) {
      matchFilters.inventory = { $gt: 0 };
    }
    
    if (Object.keys(matchFilters).length > 0) {
      pipeline.push({ $match: matchFilters });
    }
    
    // Sorting
    let sortStage;
    switch (sortBy) {
      case 'relevance':
        sortStage = query ? { score: { $meta: 'textScore' } } : { createdAt: -1 };
        break;
      case 'price_asc':
        sortStage = { price: 1 };
        break;
      case 'price_desc':
        sortStage = { price: -1 };
        break;
      case 'popularity':
        sortStage = { 'stats.views': -1 };
        break;
      default:
        sortStage = { createdAt: -1 };
    }
    
    pipeline.push({ $sort: sortStage });
    
    // Facet for results and count
    pipeline.push({
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    });
    
    const [result] = await this.products.aggregate(pipeline).toArray();
    
    return {
      products: result.results,
      totalCount: result.totalCount[0]?.count || 0,
      page,
      limit,
      totalPages: Math.ceil((result.totalCount[0]?.count || 0) / limit)
    };
  }
  
  async getAutocomplete(query, limit = 10) {
    const regex = new RegExp(`^${query}`, 'i');
    
    return await this.products.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: regex } },
            { 'category.name': { $regex: regex } },
            { tags: { $regex: regex } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          suggestions: {
            $addToSet: {
              $concat: [
                { $substrCP: ['$name', 0, 50] },
                { $cond: [{ $gt: [{ $strLenCP: '$name' }, 50] }, '...', ''] }
              ]
            }
          },
          categories: { $addToSet: '$category.name' },
          tags: { $addToSet: '$tags' }
        }
      },
      {
        $project: {
          suggestions: { $slice: ['$suggestions', limit] },
          categories: { $slice: ['$categories', 5] },
          tags: { $slice: [{ $setIntersection: ['$tags', [query]] }, 5] }
        }
      }
    ]).toArray();
  }
}
```

## Scaling Strategies

### 1. Horizontal Scaling (Sharding)

```javascript
// Sharding configuration
const shardingConfig = {
  // Choose shard key based on query patterns
  shardKey: { userId: 1, createdAt: 1 }, // Compound shard key
  
  // Shard key selection criteria:
  // 1. High cardinality (many unique values)
  // 2. Even distribution of data
  // 3. Query isolation (queries hit few shards)
  // 4. Monotonically increasing to avoid hotspots
};

class ShardedOrderService {
  constructor(mongoClient) {
    this.client = mongoClient;
    this.db = mongoClient.db('ecommerce');
    this.orders = this.db.collection('orders');
  }
  
  async setupSharding() {
    const admin = this.client.db('admin');
    
    // Enable sharding on database
    await admin.command({
      enableSharding: 'ecommerce'
    });
    
    // Create shard key index
    await this.orders.createIndex({
      userId: 1,
      createdAt: 1
    });
    
    // Shard the collection
    await admin.command({
      shardCollection: 'ecommerce.orders',
      key: { userId: 1, createdAt: 1 }
    });
    
    // Pre-split for even distribution (optional)
    await this.presplitChunks();
  }
  
  async presplitChunks() {
    const admin = this.client.db('admin');
    
    // Split at specific user ranges
    const splitPoints = [
      { userId: ObjectId('400000000000000000000000') },
      { userId: ObjectId('800000000000000000000000') },
      { userId: ObjectId('c00000000000000000000000') }
    ];
    
    for (const splitPoint of splitPoints) {
      try {
        await admin.command({
          split: 'ecommerce.orders',
          middle: splitPoint
        });
      } catch (error) {
        console.log('Split point already exists:', splitPoint);
      }
    }
  }
  
  // Query that targets specific shard (includes shard key)
  async getUserOrders(userId, startDate, endDate) {
    return await this.orders.find({
      userId: new ObjectId(userId), // Shard key component
      createdAt: {                  // Shard key component
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .sort({ createdAt: -1 })
    .toArray();
  }
  
  // Query that requires scatter-gather (doesn't include full shard key)
  async getOrdersByStatus(status) {
    // This query will hit all shards
    return await this.orders.find({ status })
      .hint({ status: 1 }) // Use index to optimize
      .toArray();
  }
}
```

### 2. Read Replicas and Load Balancing

```javascript
const { MongoClient, ReadPreference } = require('mongodb');

class ScalableDataAccess {
  constructor() {
    this.client = null;
    this.db = null;
  }
  
  async connect() {
    const connectionString = 'mongodb://primary:27017,secondary1:27017,secondary2:27017/ecommerce?replicaSet=rs0';
    
    this.client = new MongoClient(connectionString, {
      readPreference: ReadPreference.SECONDARY_PREFERRED,
      readConcern: { level: 'majority' },
      writeConcern: { w: 'majority', j: true }
    });
    
    await this.client.connect();
    this.db = this.client.db('ecommerce');
  }
  
  // Write operations - always go to primary
  async createOrder(orderData) {
    const orders = this.db.collection('orders');
    
    const result = await orders.insertOne(orderData, {
      writeConcern: { w: 'majority', j: true }
    });
    
    return result;
  }
  
  // Read operations - can use secondaries
  async getOrderHistory(userId, options = {}) {
    const { 
      readPreference = ReadPreference.SECONDARY_PREFERRED,
      maxStalenessSeconds = 120 
    } = options;
    
    const orders = this.db.collection('orders');
    
    return await orders.find(
      { userId: new ObjectId(userId) },
      {
        readPreference,
        maxStalenessSeconds
      }
    )
    .sort({ createdAt: -1 })
    .toArray();
  }
  
  // Analytics queries - use secondary replicas
  async getAnalytics(startDate, endDate) {
    const orders = this.db.collection('orders');
    
    return await orders.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ], {
      readPreference: ReadPreference.SECONDARY, // Force secondary
      allowDiskUse: true // Allow large aggregations
    }).toArray();
  }
  
  // Real-time operations - require primary
  async updateInventory(productId, quantity) {
    const products = this.db.collection('products');
    
    return await products.updateOne(
      { _id: new ObjectId(productId) },
      { $inc: { inventory: -quantity } },
      {
        readPreference: ReadPreference.PRIMARY,
        writeConcern: { w: 'majority', j: true }
      }
    );
  }
}
```

### 3. Caching Strategies

```javascript
const Redis = require('redis');

class CachedDataService {
  constructor(mongoDb) {
    this.db = mongoDb;
    this.cache = Redis.createClient();
    this.cache.connect();
  }
  
  async getProduct(productId) {
    const cacheKey = `product:${productId}`;
    
    // Try cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Cache miss - fetch from database
    const product = await this.db.collection('products')
      .findOne({ _id: new ObjectId(productId) });
    
    if (product) {
      // Cache for 1 hour
      await this.cache.setEx(cacheKey, 3600, JSON.stringify(product));
    }
    
    return product;
  }
  
  async updateProduct(productId, updateData) {
    // Update database
    const result = await this.db.collection('products')
      .updateOne(
        { _id: new ObjectId(productId) },
        { $set: updateData }
      );
    
    // Invalidate cache
    await this.cache.del(`product:${productId}`);
    
    // Optional: Update cache with new data
    const updatedProduct = await this.db.collection('products')
      .findOne({ _id: new ObjectId(productId) });
    
    if (updatedProduct) {
      await this.cache.setEx(
        `product:${productId}`,
        3600,
        JSON.stringify(updatedProduct)
      );
    }
    
    return result;
  }
  
  async getPopularProducts(limit = 10) {
    const cacheKey = `popular:products:${limit}`;
    
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const products = await this.db.collection('products')
      .find({ 'stats.views': { $gt: 0 } })
      .sort({ 'stats.views': -1 })
      .limit(limit)
      .toArray();
    
    // Cache for 15 minutes (frequently changing data)
    await this.cache.setEx(cacheKey, 900, JSON.stringify(products));
    
    return products;
  }
  
  async invalidateUserCache(userId) {
    // Invalidate all user-related cache keys
    const pattern = `user:${userId}:*`;
    const keys = await this.cache.keys(pattern);
    
    if (keys.length > 0) {
      await this.cache.del(keys);
    }
  }
}
```

### 4. Data Archiving and Partitioning

```javascript
class DataArchivalService {
  constructor(db) {
    this.db = db;
    this.activeOrders = db.collection('orders');
    this.archivedOrders = db.collection('archived_orders');
  }
  
  async archiveOldOrders(daysOld = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    console.log(`Archiving orders older than ${cutoffDate}`);
    
    const session = this.db.client.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Find orders to archive
        const ordersToArchive = await this.activeOrders
          .find({
            createdAt: { $lt: cutoffDate },
            status: { $in: ['completed', 'cancelled'] }
          }, { session })
          .toArray();
        
        if (ordersToArchive.length === 0) {
          console.log('No orders to archive');
          return;
        }
        
        console.log(`Archiving ${ordersToArchive.length} orders`);
        
        // Move to archive collection
        await this.archivedOrders.insertMany(ordersToArchive, { session });
        
        // Remove from active collection
        const orderIds = ordersToArchive.map(order => order._id);
        const deleteResult = await this.activeOrders.deleteMany(
          { _id: { $in: orderIds } },
          { session }
        );
        
        console.log(`Archived ${deleteResult.deletedCount} orders`);
      });
    } finally {
      await session.endSession();
    }
  }
  
  async getOrderHistory(userId, includeArchived = false) {
    let activeOrders = await this.activeOrders
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    if (!includeArchived) {
      return activeOrders;
    }
    
    const archivedOrders = await this.archivedOrders
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Merge and sort
    return [...activeOrders, ...archivedOrders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  async createMonthlyPartition(year, month) {
    const partitionName = `orders_${year}_${String(month).padStart(2, '0')}`;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Create view for monthly partition
    await this.db.createCollection(partitionName, {
      viewOn: 'orders',
      pipeline: [
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        }
      ]
    });
    
    console.log(`Created partition ${partitionName} for period ${startDate} to ${endDate}`);
  }
}
```

This MongoDB data modeling guide provides comprehensive patterns for building scalable, high-performance data layers in your applications.