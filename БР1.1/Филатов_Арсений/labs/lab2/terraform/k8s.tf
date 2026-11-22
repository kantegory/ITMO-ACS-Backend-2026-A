# Skeleton: Managed Kubernetes + node group in two zones.
# Service account IDs and CMK details to be filled in ЛР7.

resource "yandex_kubernetes_cluster" "job" {
  name       = "job-mk8s"
  network_id = yandex_vpc_network.job.id

  master {
    version = var.k8s_version
    zonal {
      zone      = var.zone_a
      subnet_id = yandex_vpc_subnet.a.id
    }
    public_ip = true
    security_group_ids = [
      yandex_vpc_security_group.k8s_nodes.id,
      yandex_vpc_security_group.public.id,
    ]
  }

  service_account_id      = var.k8s_service_account_id
  node_service_account_id = var.k8s_node_service_account_id

  release_channel = "REGULAR"
}

resource "yandex_kubernetes_node_group" "workers" {
  cluster_id = yandex_kubernetes_cluster.job.id
  name       = "job-workers"
  version    = var.k8s_version

  instance_template {
    platform_id = "standard-v3"
    resources {
      cores  = 2
      memory = 4
    }
    boot_disk {
      type = "network-ssd"
      size = 64
    }
    network_interface {
      nat                = false
      subnet_ids         = [yandex_vpc_subnet.a.id, yandex_vpc_subnet.b.id]
      security_group_ids = [yandex_vpc_security_group.k8s_nodes.id]
    }
  }

  scale_policy {
    fixed_scale {
      size = 2
    }
  }

  allocation_policy {
    location {
      zone = var.zone_a
    }
    location {
      zone = var.zone_b
    }
  }
}
