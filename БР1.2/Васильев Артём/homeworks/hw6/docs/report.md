# HW6 Report

## Goal

Prepare a standalone HW6 project based on the HW5 Job Platform microservice backend.

## Changes

1. Created `homeworks/hw6`.
2. Copied the root `src/` application, `services/`, service Dockerfiles, OpenAPI docs, package manifests, lock files, TypeScript configs, and Docker Compose config from HW5.
3. Renamed npm packages to `job-platform-hw6` and `job-platform-hw6-<service>`.
4. Added the Docker Compose project name `job-platform-hw6`.
5. Changed external Docker ports to avoid collisions with HW5:
   - services: `3101-3107`
   - PostgreSQL databases: `16433-16439`
   - RabbitMQ: `6672`, management UI `16672`
6. Added a HW6-specific `README.md` with start commands and exposed ports.

## Verification

The following checks were run successfully:

```bash
docker compose config --quiet
npm run build
```

The TypeScript build was checked for the root package and all service packages.
