output "region" {
  value = var.region
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "kubeconfig_command" {
  value = "aws eks update-kubeconfig --name ${module.eks.cluster_name} --region ${var.region}"
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "app_secret_name" {
  value = aws_secretsmanager_secret.app.name
}

output "ecr_registry" {
  value = split("/", aws_ecr_repository.svc["api-gateway"].repository_url)[0]
}

output "ci_access_key_id" {
  value = aws_iam_access_key.ci.id
}

output "ci_secret_access_key" {
  value     = aws_iam_access_key.ci.secret
  sensitive = true
}

output "photos_bucket" {
  value = aws_s3_bucket.photos.bucket
}
