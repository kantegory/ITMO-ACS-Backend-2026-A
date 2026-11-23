# Skeleton: one Managed PostgreSQL cluster, five logical databases (lab2_*).
# Apply and tune HA / resources in ЛР7.

resource "yandex_mdb_postgresql_cluster" "job" {
  name        = "job-pg"
  environment = "PRODUCTION"
  network_id  = yandex_vpc_network.job.id

  config {
    version = "16"
    resources {
      resource_preset_id = "s2.micro"
      disk_type_id       = "network-ssd"
      disk_size          = 20
    }
  }

  host {
    zone      = var.zone_a
    subnet_id = yandex_vpc_subnet.a.id
  }

  # Uncomment for HA across zones (preferred for ЛР7 if budget allows):
  # host {
  #   zone      = var.zone_b
  #   subnet_id = yandex_vpc_subnet.b.id
  # }

  security_group_ids = [yandex_vpc_security_group.postgres.id]
}

resource "yandex_mdb_postgresql_user" "app" {
  cluster_id = yandex_mdb_postgresql_cluster.job.id
  name       = "job_app"
  password   = var.mdb_password
}

resource "yandex_mdb_postgresql_database" "auth" {
  cluster_id = yandex_mdb_postgresql_cluster.job.id
  name       = "lab2_auth"
  owner      = yandex_mdb_postgresql_user.app.name
}

resource "yandex_mdb_postgresql_database" "catalog" {
  cluster_id = yandex_mdb_postgresql_cluster.job.id
  name       = "lab2_catalog"
  owner      = yandex_mdb_postgresql_user.app.name
}

resource "yandex_mdb_postgresql_database" "jobseeker" {
  cluster_id = yandex_mdb_postgresql_cluster.job.id
  name       = "lab2_jobseeker"
  owner      = yandex_mdb_postgresql_user.app.name
}

resource "yandex_mdb_postgresql_database" "employer" {
  cluster_id = yandex_mdb_postgresql_cluster.job.id
  name       = "lab2_employer"
  owner      = yandex_mdb_postgresql_user.app.name
}

resource "yandex_mdb_postgresql_database" "application" {
  cluster_id = yandex_mdb_postgresql_cluster.job.id
  name       = "lab2_application"
  owner      = yandex_mdb_postgresql_user.app.name
}
