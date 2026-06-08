// Типы событий

export interface UserRegisteredEvent {
  userId: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  timestamp: string;
}

export interface UserRoleUpdatedEvent {
  userId: number;
  oldRole: string;
  newRole: string;
  timestamp: string;
}

export interface CompanyCreatedEvent {
  companyId: number;
  title: string;
  ownerId: number;
  timestamp: string;
}

export interface ServiceCreatedEvent {
  serviceId: number;
  name: string;
  price: number;
  companyId: number;
  timestamp: string;
}

export interface RequestCreatedEvent {
  requestId: number;
  serviceId: number;
  userId: number;
  status: string;
  timestamp: string;
}

export interface RequestStatusChangedEvent {
  requestId: number;
  oldStatus: string;
  newStatus: string;
  changedBy: number;
  timestamp: string;
}

export interface ReviewCreatedEvent {
  reviewId: number;
  serviceId: number;
  userId: number;
  rating: number;
  comment?: string;
  timestamp: string;
}

// Routing keys
export const RoutingKeys = {
  USER_REGISTERED: 'user.registered',
  USER_ROLE_UPDATED: 'user.role.updated',
  COMPANY_CREATED: 'company.created',
  SERVICE_CREATED: 'service.created',
  REQUEST_CREATED: 'request.created',
  REQUEST_STATUS_CHANGED: 'request.status.changed',
  REVIEW_CREATED: 'review.created',
} as const;

// Exchanges
export const Exchanges = {
  USER: 'user.events',
  COMPANY: 'company.events',
  REQUEST: 'request.events',
  REVIEW: 'review.events',
} as const;

// Queues
export const Queues = {
  ANALYTICS: 'analytics.queue',
  COMPANY: 'company.queue',
} as const;