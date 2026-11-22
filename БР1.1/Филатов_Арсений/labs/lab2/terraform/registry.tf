resource "yandex_container_registry" "job" {
  name = "job-registry"
}

# Repositories are created on first push or via separate resources in ЛР7:
# job-gateway, job-auth, job-catalog, job-jobseeker, job-employer, job-application
