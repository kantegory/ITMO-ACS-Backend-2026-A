output "cluster_id" {
  value = upcloud_kubernetes_cluster.lab.id
}

output "database_id" {
  value = upcloud_managed_database_postgresql.lab.id
}

output "database_endpoint" {
  value = {
    host = upcloud_managed_database_postgresql.lab.service_host
    port = upcloud_managed_database_postgresql.lab.service_port
  }
}
