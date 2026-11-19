# ---------- Пароли ----------

resource "random_password" "db_master" {
  length  = 24
  special = false
}

resource "random_password" "db_service" {
  for_each = toset(local.db_services)
  length   = 24
  special  = false
}

resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "random_password" "rabbitmq" {
  length  = 24
  special = false
}

# ---------- RDS PostgreSQL ----------

resource "aws_security_group" "rds" {
  name        = "${local.name}-rds"
  description = "PostgreSQL only from EKS nodes and pods"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "PostgreSQL from EKS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [
      module.eks.node_security_group_id,
      module.eks.cluster_primary_security_group_id,
    ]
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${local.name}-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = var.db_instance_class

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  username = "postgres"
  password = random_password.db_master.result

  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  multi_az               = var.rds_multi_az

  backup_retention_period = 1
  skip_final_snapshot     = true
  deletion_protection     = false
  apply_immediately       = true
}

# ---------- Secrets Manager ----------

resource "aws_secretsmanager_secret" "app" {
  name = "${local.name}/app"
  # 0 — удалять сразу, чтобы после destroy можно было снова создать секрет с тем же именем
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  secret_string = jsonencode(merge(
    {
      DB_HOST            = aws_db_instance.main.address
      DB_MASTER_USER     = "postgres"
      DB_MASTER_PASSWORD = random_password.db_master.result
      JWT_SECRET_KEY     = random_password.jwt.result
      RABBITMQ_PASSWORD  = random_password.rabbitmq.result
      RABBITMQ_URL       = "amqp://app:${random_password.rabbitmq.result}@rabbitmq:5672"
    },
    { for s in local.db_services : "${upper(s)}_DB_PASSWORD" => random_password.db_service[s].result }
  ))
}

# ---------- S3 для фотографий ----------

resource "aws_s3_bucket" "photos" {
  bucket_prefix = "${local.name}-photos-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "photos" {
  bucket                  = aws_s3_bucket.photos.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------- ECR ----------

resource "aws_ecr_repository" "svc" {
  for_each = toset(local.images)

  name                 = "${local.name}/${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}
