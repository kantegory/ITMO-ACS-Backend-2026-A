terraform {
  required_version = ">= 1.5.0"

  required_providers {
    yandex = {
      source  = "yandex-cloud/yandex"
      version = ">= 0.120.0"
    }
  }
}

provider "yandex" {
  # token / service account key via env: YC_TOKEN, YC_CLOUD_ID, YC_FOLDER_ID
  cloud_id  = var.cloud_id
  folder_id = var.folder_id
  zone      = var.zone_a
}
