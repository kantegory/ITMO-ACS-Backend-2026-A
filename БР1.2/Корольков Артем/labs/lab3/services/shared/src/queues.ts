/** Очереди межсервисного взаимодействия (RabbitMQ). */
export const QUEUE_RESERVATIONS = 'reservations';
export const QUEUE_RESERVATIONS_VALIDATED = 'reservations.validated';
export const QUEUE_RESERVATIONS_FAILED = 'reservations.failed';
export const QUEUE_RESERVATIONS_COMPLETED = 'reservations.completed';

export const ALL_QUEUES = [
  QUEUE_RESERVATIONS,
  QUEUE_RESERVATIONS_VALIDATED,
  QUEUE_RESERVATIONS_FAILED,
  QUEUE_RESERVATIONS_COMPLETED
] as const;
