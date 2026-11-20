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

# Admin login of the managed PostgreSQL, used once by k8s/secrets.sh to create per-service roles.
output "database_admin" {
  sensitive = true
  value = {
    username = upcloud_managed_database_postgresql.lab.service_username
    password = upcloud_managed_database_postgresql.lab.service_password
  }
}
