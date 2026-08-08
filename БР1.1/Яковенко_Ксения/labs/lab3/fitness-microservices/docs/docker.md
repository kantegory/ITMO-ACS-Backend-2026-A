# Docker Compose design

## Containers

- 8 Node.js application containers;
- PostgreSQL 16;
- RabbitMQ with management plugin;
- optional one-shot seed container.

## Network

All containers are attached to `fitness-network`. Internal calls use Compose DNS names instead of host ports.

## Startup dependencies

- domain services wait for PostgreSQL healthcheck;
- Training Plan and Notification wait for RabbitMQ;
- API Gateway waits for all domain service healthchecks.

## Persistence

- `fitness_lab3_postgres_data` - PostgreSQL;
- `fitness_lab3_rabbitmq_data` - RabbitMQ definitions/messages;
- `fitness_lab3_uploads` - files saved by Media Service.
