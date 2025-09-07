# AWS Architecture Patterns

## Overview

AWS cloud architecture patterns for building scalable, resilient, and cost-effective applications.

## Well-Architected Framework Pillars

### 1. Operational Excellence

```javascript
// Infrastructure as Code with AWS CDK
const { Stack, StackProps } = require('aws-cdk-lib');
const { Construct } = require('constructs');
const ec2 = require('aws-cdk-lib/aws-ec2');
const ecs = require('aws-cdk-lib/aws-ecs');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const logs = require('aws-cdk-lib/aws-logs');
const iam = require('aws-cdk-lib/aws-iam');

class WebApplicationStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      maxAzs: 3,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      natGateways: 2, // High availability
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'WebAppCluster', {
      vpc,
      clusterName: 'web-app-cluster',
      containerInsights: true
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'WebAppTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'WebAppLogs', {
      logGroupName: '/ecs/web-app',
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // Container Definition
    const container = taskDefinition.addContainer('WebAppContainer', {
      image: ecs.ContainerImage.fromRegistry('myregistry/web-app:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'web-app',
        logGroup: logGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000'
      },
      secrets: {
        DATABASE_URL: ecs.Secret.fromSecretsManager(
          secretsManager.Secret.fromSecretNameV2(this, 'DBSecret', 'prod/database')
        )
      }
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP
    });

    // ECS Service
    const service = new ecs.FargateService(this, 'WebAppService', {
      cluster,
      taskDefinition,
      desiredCount: 3,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      healthCheckGracePeriod: Duration.seconds(60),
      serviceName: 'web-app-service'
    });

    // Application Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'web-app-alb'
    });

    const listener = lb.addListener('WebAppListener', {
      port: 80,
      open: true
    });

    listener.addTargets('WebAppTargets', {
      port: 3000,
      targets: [service],
      healthCheckPath: '/health',
      healthCheckIntervalSeconds: 30,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5
    });

    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 20
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(300),
      scaleOutCooldown: Duration.seconds(60)
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80
    });
  }
}
```

### 2. Security Best Practices

```javascript
// Security-focused AWS architecture
const { SecurityGroup, Vpc } = require('aws-cdk-lib/aws-ec2');
const { Role, ServicePrincipal, ManagedPolicy } = require('aws-cdk-lib/aws-iam');
const { Secret } = require('aws-cdk-lib/aws-secretsmanager');
const { Key } = require('aws-cdk-lib/aws-kms');

class SecureWebApplicationStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // KMS Key for encryption
    const kmsKey = new Key(this, 'WebAppKey', {
      description: 'KMS Key for Web Application',
      enableKeyRotation: true,
    });

    // IAM Role for ECS Task
    const taskRole = new Role(this, 'ECSTaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for ECS tasks with minimal permissions',
    });

    // Grant only necessary permissions
    taskRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );

    // Custom policy for specific resources
    taskRole.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [
        'arn:aws:secretsmanager:*:*:secret:prod/database*'
      ]
    }));

    // Security Groups with least privilege
    const albSecurityGroup = new SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false
    });

    // Allow HTTP/HTTPS from internet
    albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Only allow outbound to ECS tasks
    albSecurityGroup.addEgressRule(
      ecsSecurityGroup,
      Port.tcp(3000),
      'Allow traffic to ECS tasks'
    );

    const ecsSecurityGroup = new SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: false
    });

    // Only allow inbound from ALB
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      Port.tcp(3000),
      'Allow traffic from ALB'
    );

    // Allow outbound HTTPS for API calls
    ecsSecurityGroup.addEgressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Database Security Group
    const dbSecurityGroup = new SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false
    });

    // Only allow database access from ECS
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      Port.tcp(5432),
      'Allow PostgreSQL from ECS'
    );

    // WAF for additional security
    const webAcl = new wafv2.CfnWebACL(this, 'WebAppWAF', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP'
            }
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule'
          }
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric'
          }
        }
      ]
    });
  }
}
```

## Serverless Patterns

### 1. Lambda-based API with API Gateway

```javascript
// Serverless API with AWS Lambda and API Gateway
const { Function, Runtime, Code } = require('aws-cdk-lib/aws-lambda');
const { RestApi, LambdaIntegration } = require('aws-cdk-lib/aws-apigateway');
const { Table, AttributeType, BillingMode } = require('aws-cdk-lib/aws-dynamodb');

class ServerlessApiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // DynamoDB Table
    const ordersTable = new Table(this, 'OrdersTable', {
      tableName: 'orders',
      partitionKey: {
        name: 'orderId',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'createdAt',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: TableEncryption.AWS_MANAGED
    });

    // Lambda Functions
    const createOrderFunction = new Function(this, 'CreateOrderFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'createOrder.handler',
      code: Code.fromAsset('lambda'),
      environment: {
        ORDERS_TABLE: ordersTable.tableName,
        REGION: this.region
      },
      timeout: Duration.seconds(30),
      memorySize: 512
    });

    const getOrderFunction = new Function(this, 'GetOrderFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'getOrder.handler',
      code: Code.fromAsset('lambda'),
      environment: {
        ORDERS_TABLE: ordersTable.tableName,
        REGION: this.region
      },
      timeout: Duration.seconds(10),
      memorySize: 256
    });

    // Grant permissions
    ordersTable.grantWriteData(createOrderFunction);
    ordersTable.grantReadData(getOrderFunction);

    // API Gateway
    const api = new RestApi(this, 'OrdersApi', {
      restApiName: 'Orders Service',
      description: 'Serverless orders API',
      defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowHeaders: ['Content-Type', 'Authorization']
      }
    });

    // API Resources and Methods
    const orders = api.root.addResource('orders');
    
    orders.addMethod('POST', new LambdaIntegration(createOrderFunction), {
      apiKeyRequired: true,
      requestValidator: api.addRequestValidator('CreateOrderValidator', {
        requestValidatorName: 'create-order-validator',
        validateRequestBody: true,
        validateRequestParameters: false
      }),
      requestModels: {
        'application/json': api.addModel('CreateOrderModel', {
          modelName: 'CreateOrderModel',
          contentType: 'application/json',
          schema: {
            type: JsonSchemaType.OBJECT,
            required: ['userId', 'items', 'totalAmount'],
            properties: {
              userId: { type: JsonSchemaType.STRING },
              items: {
                type: JsonSchemaType.ARRAY,
                items: {
                  type: JsonSchemaType.OBJECT,
                  properties: {
                    productId: { type: JsonSchemaType.STRING },
                    quantity: { type: JsonSchemaType.NUMBER },
                    price: { type: JsonSchemaType.NUMBER }
                  }
                }
              },
              totalAmount: { type: JsonSchemaType.NUMBER }
            }
          }
        })
      }
    });

    const orderById = orders.addResource('{orderId}');
    orderById.addMethod('GET', new LambdaIntegration(getOrderFunction));

    // Usage Plan for API Key
    const plan = api.addUsagePlan('UsagePlan', {
      name: 'Standard',
      throttle: {
        rateLimit: 100,
        burstLimit: 200
      },
      quota: {
        limit: 10000,
        period: Period.MONTH
      }
    });

    plan.addApiStage({
      stage: api.deploymentStage
    });
  }
}

// Lambda function implementation
// lambda/createOrder.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  try {
    const requestBody = JSON.parse(event.body);
    
    // Validate request
    if (!requestBody.userId || !requestBody.items || !requestBody.totalAmount) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing required fields'
        })
      };
    }

    // Create order
    const order = {
      orderId: generateOrderId(),
      userId: requestBody.userId,
      items: requestBody.items,
      totalAmount: requestBody.totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to DynamoDB
    await dynamodb.put({
      TableName: process.env.ORDERS_TABLE,
      Item: order
    }).promise();

    // Publish event to EventBridge
    const eventbridge = new AWS.EventBridge();
    await eventbridge.putEvents({
      Entries: [{
        Source: 'orders.api',
        DetailType: 'Order Created',
        Detail: JSON.stringify({
          orderId: order.orderId,
          userId: order.userId,
          totalAmount: order.totalAmount
        })
      }]
    }).promise();

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: order
      })
    };

  } catch (error) {
    console.error('Error creating order:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error'
      })
    };
  }
};

function generateOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### 2. Event-Driven Architecture with EventBridge

```javascript
// Event-driven serverless architecture
const { Rule, EventBus } = require('aws-cdk-lib/aws-events');
const { LambdaFunction } = require('aws-cdk-lib/aws-events-targets');
const { Queue } = require('aws-cdk-lib/aws-sqs');
const { SqsEventSource } = require('aws-cdk-lib/aws-lambda-event-sources');

class EventDrivenStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Custom EventBridge Bus
    const orderEventBus = new EventBus(this, 'OrderEventBus', {
      eventBusName: 'order-events'
    });

    // Lambda Functions for different event handlers
    const inventoryService = new Function(this, 'InventoryService', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'inventory.handler',
      code: Code.fromAsset('lambda'),
      environment: {
        INVENTORY_TABLE: inventoryTable.tableName
      }
    });

    const paymentService = new Function(this, 'PaymentService', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'payment.handler',
      code: Code.fromAsset('lambda'),
      environment: {
        PAYMENT_API_KEY: paymentApiKey.secretValue.toString()
      }
    });

    const notificationService = new Function(this, 'NotificationService', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'notification.handler',
      code: Code.fromAsset('lambda'),
      environment: {
        SNS_TOPIC_ARN: snsTopicArn
      }
    });

    // SQS Queues for reliable processing
    const inventoryQueue = new Queue(this, 'InventoryQueue', {
      queueName: 'inventory-updates',
      visibilityTimeout: Duration.seconds(300),
      deadLetterQueue: {
        queue: new Queue(this, 'InventoryDLQ', {
          queueName: 'inventory-dlq'
        }),
        maxReceiveCount: 3
      }
    });

    // EventBridge Rules
    new Rule(this, 'OrderCreatedRule', {
      eventBus: orderEventBus,
      ruleName: 'order-created-rule',
      eventPattern: {
        source: ['orders.api'],
        detailType: ['Order Created']
      },
      targets: [
        new LambdaFunction(inventoryService),
        new LambdaFunction(paymentService),
        new SqsQueue(inventoryQueue)
      ]
    });

    new Rule(this, 'PaymentProcessedRule', {
      eventBus: orderEventBus,
      eventPattern: {
        source: ['payment.service'],
        detailType: ['Payment Processed'],
        detail: {
          status: ['succeeded']
        }
      },
      targets: [
        new LambdaFunction(notificationService)
      ]
    });

    // Connect SQS to Lambda
    inventoryService.addEventSource(new SqsEventSource(inventoryQueue, {
      batchSize: 10,
      maxBatchingWindow: Duration.seconds(10)
    }));
  }
}

// Event handler implementation
// lambda/inventory.js
const AWS = require('aws-sdk');
const eventbridge = new AWS.EventBridge();

exports.handler = async (event) => {
  console.log('Processing inventory update:', JSON.stringify(event));

  try {
    // Handle both direct EventBridge events and SQS messages
    const records = event.Records || [{ body: JSON.stringify(event) }];
    
    for (const record of records) {
      const orderEvent = JSON.parse(record.body);
      
      if (orderEvent.detail) {
        const { orderId, items } = orderEvent.detail;
        
        // Update inventory
        await updateInventory(items);
        
        // Publish inventory updated event
        await eventbridge.putEvents({
          Entries: [{
            Source: 'inventory.service',
            DetailType: 'Inventory Updated',
            Detail: JSON.stringify({
              orderId,
              items,
              timestamp: new Date().toISOString()
            })
          }]
        }).promise();
      }
    }
    
    return { statusCode: 200, body: 'Inventory updated successfully' };
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error; // This will send the message to DLQ if it fails repeatedly
  }
};

async function updateInventory(items) {
  const dynamodb = new AWS.DynamoDB.DocumentClient();
  
  for (const item of items) {
    await dynamodb.update({
      TableName: process.env.INVENTORY_TABLE,
      Key: { productId: item.productId },
      UpdateExpression: 'ADD inventory :quantity',
      ExpressionAttributeValues: {
        ':quantity': -item.quantity
      }
    }).promise();
  }
}
```

## Data Architecture Patterns

### 1. Data Lake with S3 and Analytics

```javascript
// Data Lake architecture with S3, Glue, and Athena
const { Bucket, BucketEncryption } = require('aws-cdk-lib/aws-s3');
const { Database, Table, Column, Schema } = require('@aws-cdk/aws-glue-alpha');
const { CfnWorkGroup } = require('aws-cdk-lib/aws-athena');

class DataLakeStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // S3 Buckets for different data zones
    const rawDataBucket = new Bucket(this, 'RawDataBucket', {
      bucketName: 'company-data-lake-raw',
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true,
      lifecycleRules: [{
        id: 'raw-data-lifecycle',
        enabled: true,
        transitions: [{
          storageClass: StorageClass.INFREQUENT_ACCESS,
          transitionAfter: Duration.days(30)
        }, {
          storageClass: StorageClass.GLACIER,
          transitionAfter: Duration.days(90)
        }]
      }]
    });

    const processedDataBucket = new Bucket(this, 'ProcessedDataBucket', {
      bucketName: 'company-data-lake-processed',
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true
    });

    const analyticsDataBucket = new Bucket(this, 'AnalyticsDataBucket', {
      bucketName: 'company-data-lake-analytics',
      encryption: BucketEncryption.S3_MANAGED,
      versioned: true
    });

    // AWS Glue Database
    const dataLakeDatabase = new Database(this, 'DataLakeDatabase', {
      databaseName: 'data_lake'
    });

    // Glue Tables for different data sources
    const ordersTable = new Table(this, 'OrdersTable', {
      database: dataLakeDatabase,
      tableName: 'orders',
      columns: [
        { name: 'order_id', type: Schema.STRING },
        { name: 'user_id', type: Schema.STRING },
        { name: 'total_amount', type: Schema.DOUBLE },
        { name: 'status', type: Schema.STRING },
        { name: 'created_at', type: Schema.TIMESTAMP }
      ],
      dataFormat: DataFormat.PARQUET,
      bucket: processedDataBucket,
      s3Prefix: 'orders/'
    });

    const userEventsTable = new Table(this, 'UserEventsTable', {
      database: dataLakeDatabase,
      tableName: 'user_events',
      columns: [
        { name: 'user_id', type: Schema.STRING },
        { name: 'event_type', type: Schema.STRING },
        { name: 'event_data', type: Schema.STRING },
        { name: 'timestamp', type: Schema.TIMESTAMP },
        { name: 'session_id', type: Schema.STRING }
      ],
      dataFormat: DataFormat.JSON,
      bucket: rawDataBucket,
      s3Prefix: 'events/',
      partitionKeys: [
        { name: 'year', type: Schema.STRING },
        { name: 'month', type: Schema.STRING },
        { name: 'day', type: Schema.STRING }
      ]
    });

    // Athena Workgroup for analytics
    const analyticsWorkgroup = new CfnWorkGroup(this, 'AnalyticsWorkgroup', {
      name: 'data-analytics',
      workGroupConfiguration: {
        resultConfiguration: {
          outputLocation: `s3://${analyticsDataBucket.bucketName}/query-results/`
        },
        enforceWorkGroupConfiguration: true,
        publishCloudWatchMetrics: true
      }
    });

    // Lambda function for data processing
    const dataProcessingFunction = new Function(this, 'DataProcessingFunction', {
      runtime: Runtime.PYTHON_3_9,
      handler: 'process_data.handler',
      code: Code.fromAsset('lambda'),
      environment: {
        RAW_BUCKET: rawDataBucket.bucketName,
        PROCESSED_BUCKET: processedDataBucket.bucketName,
        GLUE_DATABASE: dataLakeDatabase.databaseName
      },
      timeout: Duration.minutes(15),
      memorySize: 1024
    });

    // Grant permissions
    rawDataBucket.grantRead(dataProcessingFunction);
    processedDataBucket.grantWrite(dataProcessingFunction);
    dataLakeDatabase.grantCreateTable(dataProcessingFunction);

    // EventBridge rule to trigger processing
    new Rule(this, 'DataProcessingRule', {
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: { name: [rawDataBucket.bucketName] }
        }
      },
      targets: [new LambdaFunction(dataProcessingFunction)]
    });
  }
}

// Data processing Lambda function
// lambda/process_data.py
import json
import boto3
import pandas as pd
from datetime import datetime

s3 = boto3.client('s3')
glue = boto3.client('glue')

def handler(event, context):
    try:
        # Parse S3 event
        bucket = event['detail']['bucket']['name']
        key = event['detail']['object']['key']
        
        print(f"Processing file: s3://{bucket}/{key}")
        
        # Download and process data
        response = s3.get_object(Bucket=bucket, Key=key)
        data = json.loads(response['Body'].read())
        
        # Process based on data type
        if 'orders' in key:
            processed_data = process_orders_data(data)
            output_key = f"orders/{datetime.now().strftime('%Y/%m/%d')}/processed_orders.parquet"
        elif 'events' in key:
            processed_data = process_events_data(data)
            output_key = f"events/{datetime.now().strftime('%Y/%m/%d')}/processed_events.parquet"
        else:
            print(f"Unknown data type for key: {key}")
            return
        
        # Convert to DataFrame and save as Parquet
        df = pd.DataFrame(processed_data)
        
        # Upload to processed bucket
        parquet_buffer = df.to_parquet(engine='pyarrow')
        s3.put_object(
            Bucket=os.environ['PROCESSED_BUCKET'],
            Key=output_key,
            Body=parquet_buffer
        )
        
        # Update Glue catalog
        update_glue_table(output_key)
        
        return {
            'statusCode': 200,
            'body': json.dumps(f'Successfully processed {key}')
        }
        
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        raise

def process_orders_data(data):
    # Data cleaning and transformation logic
    processed = []
    for record in data:
        processed.append({
            'order_id': record.get('orderId'),
            'user_id': record.get('userId'),
            'total_amount': float(record.get('totalAmount', 0)),
            'status': record.get('status', 'unknown'),
            'created_at': datetime.fromisoformat(record.get('createdAt')),
            'item_count': len(record.get('items', [])),
            'category': record.get('items', [{}])[0].get('category', 'unknown')
        })
    return processed

def process_events_data(data):
    # Event data processing logic
    processed = []
    for record in data:
        processed.append({
            'user_id': record.get('userId'),
            'event_type': record.get('eventType'),
            'event_data': json.dumps(record.get('eventData', {})),
            'timestamp': datetime.fromisoformat(record.get('timestamp')),
            'session_id': record.get('sessionId'),
            'page_url': record.get('eventData', {}).get('pageUrl', ''),
            'user_agent': record.get('eventData', {}).get('userAgent', '')
        })
    return processed

def update_glue_table(s3_key):
    # Update Glue table partitions
    table_name = s3_key.split('/')[0]
    
    try:
        glue.update_partition(
            DatabaseName=os.environ['GLUE_DATABASE'],
            TableName=table_name,
            PartitionInput={
                'Values': s3_key.split('/')[1:4],  # year/month/day
                'StorageDescriptor': {
                    'Location': f"s3://{os.environ['PROCESSED_BUCKET']}/{'/'.join(s3_key.split('/')[:-1])}/"
                }
            }
        )
    except glue.exceptions.EntityNotFoundException:
        # Create partition if it doesn't exist
        glue.create_partition(
            DatabaseName=os.environ['GLUE_DATABASE'],
            TableName=table_name,
            PartitionInput={
                'Values': s3_key.split('/')[1:4],
                'StorageDescriptor': {
                    'Location': f"s3://{os.environ['PROCESSED_BUCKET']}/{'/'.join(s3_key.split('/')[:-1])}/"
                }
            }
        )
```

This AWS architecture patterns guide provides comprehensive, production-ready patterns for building scalable, secure, and cost-effective cloud applications using AWS services.