resource "yandex_vpc_network" "job" {
  name = var.network_name
}

resource "yandex_vpc_subnet" "a" {
  name           = "job-subnet-a"
  zone           = var.zone_a
  network_id     = yandex_vpc_network.job.id
  v4_cidr_blocks = [var.subnet_a_cidr]
}

resource "yandex_vpc_subnet" "b" {
  name           = "job-subnet-b"
  zone           = var.zone_b
  network_id     = yandex_vpc_network.job.id
  v4_cidr_blocks = [var.subnet_b_cidr]
}

resource "yandex_vpc_security_group" "public" {
  name       = "job-sg-public"
  network_id = yandex_vpc_network.job.id

  ingress {
    protocol       = "TCP"
    port           = 443
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol       = "ANY"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "yandex_vpc_security_group" "k8s_nodes" {
  name       = "job-sg-k8s-nodes"
  network_id = yandex_vpc_network.job.id

  ingress {
    protocol          = "TCP"
    from_port         = 30000
    to_port           = 32767
    security_group_id = yandex_vpc_security_group.public.id
  }

  ingress {
    protocol       = "ANY"
    v4_cidr_blocks = [var.subnet_a_cidr, var.subnet_b_cidr]
  }

  egress {
    protocol       = "ANY"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "yandex_vpc_security_group" "postgres" {
  name       = "job-sg-postgres"
  network_id = yandex_vpc_network.job.id

  ingress {
    protocol          = "TCP"
    port              = 5432
    security_group_id = yandex_vpc_security_group.k8s_nodes.id
  }
}

resource "yandex_vpc_security_group" "rabbitmq" {
  name       = "job-sg-rabbitmq"
  network_id = yandex_vpc_network.job.id

  ingress {
    protocol          = "TCP"
    port              = 5672
    security_group_id = yandex_vpc_security_group.k8s_nodes.id
  }
}
