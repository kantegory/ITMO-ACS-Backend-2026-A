data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name = var.project
  azs  = slice(data.aws_availability_zones.available.names, 0, 2)

  # сервисы со своей базой данных
  db_services = ["auth", "restaurant", "reservation", "menu", "review"]

  # все образы приложения
  images = [
    "api-gateway",
    "auth-service",
    "restaurant-service",
    "reservation-service",
    "menu-service",
    "review-service",
    "notification-service",
  ]
}

# ---------- Сеть ----------

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.21"

  name = "${local.name}-vpc"
  cidr = "10.0.0.0/16"
  azs  = local.azs

  public_subnets   = ["10.0.0.0/24", "10.0.1.0/24"]
  private_subnets  = ["10.0.16.0/20", "10.0.32.0/20"]
  database_subnets = ["10.0.64.0/24", "10.0.65.0/24"]

  create_database_subnet_group = true

  enable_nat_gateway     = true
  single_nat_gateway     = !var.nat_per_az
  one_nat_gateway_per_az = var.nat_per_az

  enable_dns_hostnames = true
  enable_dns_support   = true

  # метки, по которым AWS Load Balancer Controller находит подсети для ALB
  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }
}

# Бесплатный Gateway Endpoint: трафик к S3 и слоям образов ECR идёт мимо NAT
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids
}

# ---------- Kubernetes ----------

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.37"

  cluster_name    = local.name
  cluster_version = var.cluster_version

  cluster_endpoint_public_access           = true
  enable_cluster_creator_admin_permissions = true

  # IRSA требует IAM OIDC provider, создание которого запрещено на Free plan.
  # Роли подам выдаются через EKS Pod Identity, поэтому IRSA не нужен.
  enable_irsa = false

  # логи control plane в CloudWatch не пишем — экономия
  cluster_enabled_log_types   = []
  create_cloudwatch_log_group = false

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_addons = {
    coredns = {}
    kube-proxy = {}
    vpc-cni = {
      before_compute = true
    }
    eks-pod-identity-agent = {
      before_compute = true
    }
  }

  eks_managed_node_groups = {
    main = {
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = [var.node_instance_type]
      capacity_type  = "ON_DEMAND"

      min_size     = var.node_min
      max_size     = var.node_max
      desired_size = var.node_min

      use_custom_launch_template = false
      disk_size                  = 20
    }
  }

  # пользователь CI (GitHub Actions) получает доступ к API кластера
  access_entries = {
    github = {
      principal_arn = aws_iam_user.ci.arn
      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }
}

# EBS CSI Driver ставится отдельно, после того как для него создана роль Pod Identity
resource "aws_eks_addon" "ebs_csi" {
  cluster_name                = module.eks.cluster_name
  addon_name                  = "aws-ebs-csi-driver"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [module.eks, module.ebs_csi_pod_identity]
}
