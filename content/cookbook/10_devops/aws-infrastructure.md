# AWS Cloud Infrastructure Patterns

## Overview
Production-ready AWS infrastructure patterns using Infrastructure as Code (IaC) with Terraform and CloudFormation.

## Core Infrastructure Patterns

### 1. Three-Tier Architecture

```hcl
# Terraform configuration for 3-tier architecture
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.project_name}-igw"
  }
}

# Public Subnets (Web Tier)
resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
    Tier = "Public"
  }
}

# Private Subnets (Application Tier)
resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
    Tier = "Private"
  }
}

# Database Subnets (Data Tier)
resource "aws_subnet" "database" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.project_name}-database-${count.index + 1}"
    Tier = "Database"
  }
}

# NAT Gateways
resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  
  domain = "vpc"
  depends_on = [aws_internet_gateway.main]
  
  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name = "${var.project_name}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = var.environment == "production"
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "alb"
    enabled = true
  }
  
  tags = {
    Environment = var.environment
  }
}

# Auto Scaling Group
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.app.id]
  
  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    project_name = var.project_name
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-instance"
      Environment = var.environment
    }
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "${var.project_name}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300
  
  min_size         = var.min_instances
  max_size         = var.max_instances
  desired_capacity = var.desired_instances
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg"
    propagate_at_launch = false
  }
}
```

### 2. EKS Cluster Setup

```hcl
# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version
  
  vpc_config {
    subnet_ids              = concat(aws_subnet.private[*].id, aws_subnet.public[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = var.cluster_endpoint_public_access_cidrs
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }
  
  encryption_config {
    resources = ["secrets"]
    provider {
      key_arn = aws_kms_key.eks.arn
    }
  }
  
  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
    aws_cloudwatch_log_group.eks,
  ]
  
  tags = {
    Environment = var.environment
  }
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-workers"
  node_role_arn   = aws_iam_role.eks_node_group.arn
  subnet_ids      = aws_subnet.private[*].id
  
  capacity_type  = "SPOT"
  instance_types = var.node_instance_types
  
  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }
  
  update_config {
    max_unavailable = 1
  }
  
  remote_access {
    ec2_ssh_key = var.node_key_name
    source_security_group_ids = [aws_security_group.eks_nodes.id]
  }
  
  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]
  
  tags = {
    Environment = var.environment
  }
}

# Fargate Profile for serverless pods
resource "aws_eks_fargate_profile" "main" {
  cluster_name           = aws_eks_cluster.main.name
  fargate_profile_name   = "${var.project_name}-fargate"
  pod_execution_role_arn = aws_iam_role.fargate_pod_execution.arn
  subnet_ids             = aws_subnet.private[*].id
  
  selector {
    namespace = "default"
    labels = {
      compute-type = "fargate"
    }
  }
  
  selector {
    namespace = "kube-system"
    labels = {
      k8s-app = "kube-dns"
    }
  }
}
```

### 3. RDS Multi-AZ Setup

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  
  tags = {
    Name = "${var.project_name} DB subnet group"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-database"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds.arn
  
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  multi_az            = var.environment == "production"
  publicly_accessible = false
  
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  deletion_protection      = var.environment == "production"
  delete_automated_backups = false
  
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  performance_insights_enabled = true
  performance_insights_kms_key_id = aws_kms_key.rds.arn
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = {
    Name        = "${var.project_name}-database"
    Environment = var.environment
  }
}

# Read Replica
resource "aws_db_instance" "replica" {
  count = var.environment == "production" ? 1 : 0
  
  identifier = "${var.project_name}-database-replica"
  
  replicate_source_db = aws_db_instance.main.id
  instance_class      = var.db_replica_instance_class
  
  publicly_accessible = false
  
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  performance_insights_enabled = true
  
  tags = {
    Name        = "${var.project_name}-database-replica"
    Environment = var.environment
  }
}
```

### 4. ElastiCache Redis Cluster

```hcl
# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# ElastiCache Redis Replication Group
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.project_name}-redis"
  description                = "Redis cluster for ${var.project_name}"
  
  node_type                  = var.redis_node_type
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = var.redis_num_cache_nodes
  automatic_failover_enabled = var.redis_num_cache_nodes > 1
  multi_az_enabled          = var.redis_num_cache_nodes > 1
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }
  
  maintenance_window = "sun:05:00-sun:06:00"
  snapshot_window    = "03:00-05:00"
  snapshot_retention_limit = 7
  
  tags = {
    Name        = "${var.project_name}-redis"
    Environment = var.environment
  }
}
```

## Security Best Practices

### 1. IAM Roles and Policies

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "${var.project_name}-ecs-task-execution"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for application-specific permissions
resource "aws_iam_role_policy" "app_policy" {
  name = "${var.project_name}-app-policy"
  role = aws_iam_role.ecs_task_execution.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.app_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/*"
      }
    ]
  })
}
```

### 2. Security Groups

```hcl
# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb"
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  
  tags = {
    Name = "${var.project_name}-alb"
  }
}

# Application Security Group
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${var.project_name}-app"
  }
}

# Database Security Group
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  
  tags = {
    Name = "${var.project_name}-rds"
  }
}
```

### 3. KMS Key Management

```hcl
# KMS Key for RDS Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Name = "${var.project_name}-rds-key"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-rds"
  target_key_id = aws_kms_key.rds.key_id
}
```

## Monitoring and Logging

### 1. CloudWatch Configuration

```hcl
# Application Log Group
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ecs/${var.project_name}"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.logs.arn
  
  tags = {
    Environment = var.environment
    Application = var.project_name
  }
}

# Custom Metrics and Alarms
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ecs cpu utilization"
  
  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${var.project_name}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors ecs memory utilization"
  
  dimensions = {
    ServiceName = aws_ecs_service.app.name
    ClusterName = aws_ecs_cluster.main.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# Database Connection Monitoring
resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.project_name}-db-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS connection count"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### 2. X-Ray Tracing

```hcl
# X-Ray Tracing Role
resource "aws_iam_role" "xray_role" {
  name = "${var.project_name}-xray-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "xray_write_only" {
  role       = aws_iam_role.xray_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}
```

## Cost Optimization Strategies

### 1. Auto Scaling Policies

```hcl
# Target Tracking Scaling Policy
resource "aws_autoscaling_policy" "cpu_scaling" {
  name                   = "${var.project_name}-cpu-scaling"
  scaling_adjustment     = 4
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
  
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Scheduled Scaling for Predictable Load
resource "aws_autoscaling_schedule" "scale_out_business_hours" {
  scheduled_action_name  = "${var.project_name}-scale-out-business-hours"
  min_size              = 3
  max_size              = 10
  desired_capacity      = 5
  recurrence            = "0 8 * * MON-FRI"
  time_zone             = "America/New_York"
  autoscaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_autoscaling_schedule" "scale_in_off_hours" {
  scheduled_action_name  = "${var.project_name}-scale-in-off-hours"
  min_size              = 1
  max_size              = 3
  desired_capacity      = 2
  recurrence            = "0 20 * * MON-FRI"
  time_zone             = "America/New_York"
  autoscaling_group_name = aws_autoscaling_group.app.name
}
```

### 2. Spot Instance Configuration

```hcl
# Mixed Instance Types ASG
resource "aws_autoscaling_group" "spot_asg" {
  name                = "${var.project_name}-spot-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  
  min_size         = 1
  max_size         = 10
  desired_capacity = 3
  
  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.mixed.id
        version            = "$Latest"
      }
      
      override {
        instance_type = "t3.medium"
      }
      
      override {
        instance_type = "t3a.medium"
      }
      
      override {
        instance_type = "m5.large"
      }
    }
    
    instances_distribution {
      on_demand_base_capacity                  = 1
      on_demand_percentage_above_base_capacity = 20
      spot_allocation_strategy                = "diversified"
      spot_instance_pools                     = 3
    }
  }
}
```

## Disaster Recovery

### 1. Cross-Region Backup Strategy

```hcl
# S3 Cross-Region Replication
resource "aws_s3_bucket_replication_configuration" "replication" {
  role   = aws_iam_role.replication.arn
  bucket = aws_s3_bucket.app_data.id
  
  rule {
    id     = "backup-replication"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.backup.arn
      storage_class = "GLACIER"
    }
  }
}

# Database Backup Strategy
resource "aws_db_snapshot" "manual_snapshot" {
  count = var.environment == "production" ? 1 : 0
  
  db_instance_identifier = aws_db_instance.main.id
  db_snapshot_identifier = "${var.project_name}-manual-snapshot-${formatdate("YYYY-MM-DD", timestamp())}"
  
  tags = {
    Environment = var.environment
    Type        = "manual"
  }
}
```

### 2. Multi-Region Setup

```hcl
# Secondary Region Provider
provider "aws" {
  alias  = "disaster_recovery"
  region = var.dr_region
}

# DR VPC
resource "aws_vpc" "dr" {
  provider = aws.disaster_recovery
  
  cidr_block           = var.dr_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.project_name}-dr-vpc"
    Environment = var.environment
  }
}
```

## Best Practices Summary

### 1. Infrastructure as Code
- Version control all infrastructure code
- Use modules for reusable components
- Implement proper state management
- Use workspaces for environment separation

### 2. Security
- Apply principle of least privilege
- Use IAM roles instead of users for services
- Enable encryption at rest and in transit
- Regularly rotate secrets and access keys
- Implement network segmentation

### 3. Cost Optimization
- Use appropriate instance types and sizes
- Implement auto scaling based on metrics
- Leverage spot instances where appropriate
- Set up billing alerts and cost monitoring
- Regular cost optimization reviews

### 4. High Availability
- Deploy across multiple availability zones
- Implement health checks and auto healing
- Use managed services when possible
- Design for graceful degradation
- Regular disaster recovery testing

### 5. Monitoring and Alerting
- Implement comprehensive logging
- Set up proactive monitoring and alerting
- Use distributed tracing for complex applications
- Monitor both infrastructure and application metrics
- Regular performance optimization reviews