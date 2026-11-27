variable "admin_ipv4" {
  type        = string
  description = "Публичный IPv4 для доступа с этого компьютера к Kubernetes API."

  validation {
    condition     = can(cidrnetmask("${var.admin_ipv4}/32")) && var.admin_ipv4 != "0.0.0.0"
    error_message = "Укажи один IPv4-адрес без маски, например 203.0.113.10."
  }
}

variable "control_plane_ip_filter" {
  type        = list(string)
  default     = null
  description = "CIDR-фильтр доступа к Kubernetes API. По умолчанию разрешён только admin_ipv4/32; для CI/CD (ДЗ8) можно переопределить в tfvars."
}

locals {
  name = "rental-lab7"
  zone = "fi-hel2"
  cidr = "10.42.0.0/24"
}

resource "upcloud_router" "lab" {
  name = "${local.name}-router"
}

resource "upcloud_network" "lab" {
  name   = "${local.name}-net"
  zone   = local.zone
  router = upcloud_router.lab.id

  ip_network {
    address            = local.cidr
    family             = "IPv4"
    dhcp               = true
    dhcp_default_route = true
  }
}

resource "upcloud_gateway" "nat" {
  name     = "${local.name}-nat"
  zone     = local.zone
  plan     = "development"
  features = ["nat"]

  router {
    id = upcloud_router.lab.id
  }
}

resource "upcloud_kubernetes_cluster" "lab" {
  name                    = local.name
  zone                    = local.zone
  network                 = upcloud_network.lab.id
  plan                    = "prod-md-ha"
  private_node_groups     = true
  control_plane_ip_filter = coalesce(var.control_plane_ip_filter, ["${var.admin_ipv4}/32"])
  fetch_kubeconfig        = true

  # Приватным узлам нужен работающий маршрут в интернет при первом запуске.
  depends_on = [upcloud_gateway.nat]
}

resource "upcloud_kubernetes_node_group" "workers" {
  name          = "workers"
  cluster       = upcloud_kubernetes_cluster.lab.id
  node_count    = 3
  plan          = "PREMIUM-2xCPU-4GB"
  anti_affinity = true
}

resource "upcloud_managed_database_postgresql" "lab" {
  name             = "${local.name}-db"
  title            = "Rental Lab 7"
  zone             = local.zone
  plan_compute     = "rdb.standard.2CPU-8GB"
  plan_node_count  = 2
  plan_storage_gib = 10
  plan_backups     = "regular"

  network {
    name   = "private"
    type   = "private"
    family = "IPv4"
    uuid   = upcloud_network.lab.id
  }

  properties {
    version                             = "16"
    public_access                       = false
    automatic_utility_network_ip_filter = false
  }
}

resource "upcloud_managed_database_logical_database" "service" {
  for_each = toset(["identity", "property", "rental", "messaging"])

  service = upcloud_managed_database_postgresql.lab.id
  name    = each.key
}

resource "local_sensitive_file" "kubeconfig" {
  filename             = "${path.module}/.lab7/kubeconfig.yaml"
  content              = upcloud_kubernetes_cluster.lab.kubeconfig.kubeconfig
  file_permission      = "0600"
  directory_permission = "0700"
}
