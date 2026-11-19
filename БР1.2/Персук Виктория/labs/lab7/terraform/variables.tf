variable "region" {
  description = "Регион AWS"
  type        = string
  default     = "ap-southeast-2"
}

variable "project" {
  description = "Префикс имён всех ресурсов"
  type        = string
  default     = "restaurant-lab"
}

variable "cluster_version" {
  description = "Версия Kubernetes в EKS"
  type        = string
  default     = "1.36"
}

variable "node_instance_type" {
  description = "Тип инстанса узлов EKS (на Free plan: m7i-flex.large или c7i-flex.large)"
  type        = string
  default     = "m7i-flex.large"
}

variable "node_min" {
  description = "Минимальное число узлов"
  type        = number
  default     = 2
}

variable "node_max" {
  description = "Максимальное число узлов (Cluster Autoscaler)"
  type        = number
  default     = 3
}

variable "db_instance_class" {
  description = "Класс инстанса RDS (на Free plan доступны только micro-классы)"
  type        = string
  default     = "db.t4g.micro"
}

variable "rds_multi_az" {
  description = "Включить Multi-AZ для RDS (удваивает стоимость БД)"
  type        = bool
  default     = false
}

variable "nat_per_az" {
  description = "NAT Gateway в каждой AZ вместо одного на VPC"
  type        = bool
  default     = false
}

