terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.95"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Состояние хранится в S3. Имя бакета передаётся при init:
  #   terraform init -backend-config="bucket=<имя бакета>"
  backend "s3" {
    key          = "lab7/terraform.tfstate"
    region       = "ap-southeast-2"
    use_lockfile = true
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      project = var.project
    }
  }
}
