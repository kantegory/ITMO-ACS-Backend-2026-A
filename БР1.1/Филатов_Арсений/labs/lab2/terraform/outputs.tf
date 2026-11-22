output "network_id" {
  value = yandex_vpc_network.job.id
}

output "subnet_a_id" {
  value = yandex_vpc_subnet.a.id
}

output "subnet_b_id" {
  value = yandex_vpc_subnet.b.id
}

output "registry_id" {
  value = yandex_container_registry.job.id
}

output "mdb_cluster_id" {
  value = yandex_mdb_postgresql_cluster.job.id
}

output "k8s_cluster_id" {
  value = yandex_kubernetes_cluster.job.id
}
