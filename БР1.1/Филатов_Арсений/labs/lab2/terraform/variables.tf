variable "cloud_id" {
  type        = string
  description = "Yandex Cloud ID"
}

variable "folder_id" {
  type        = string
  description = "Folder ID for job-search infra"
}

variable "zone_a" {
  type    = string
  default = "ru-central1-a"
}

variable "zone_b" {
  type    = string
  default = "ru-central1-b"
}

variable "network_name" {
  type    = string
  default = "job-net"
}

variable "subnet_a_cidr" {
  type    = string
  default = "10.128.0.0/24"
}

variable "subnet_b_cidr" {
  type    = string
  default = "10.129.0.0/24"
}

variable "k8s_version" {
  type    = string
  default = "1.30"
}

variable "mdb_password" {
  type        = string
  sensitive   = true
  description = "Master password for Managed PostgreSQL"
}

variable "k8s_service_account_id" {
  type        = string
  description = "SA for Managed Kubernetes control plane (fill in ЛР7)"
  default     = ""
}

variable "k8s_node_service_account_id" {
  type        = string
  description = "SA for Kubernetes node group (fill in ЛР7)"
  default     = ""
}
