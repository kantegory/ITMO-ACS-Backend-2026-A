export const EVENTS_EXCHANGE = "jobsearch.events";

export type ApplicationCreatedEvent = {
  type: "application.created";
  applicationId: number;
  vacancyId: number;
  resumeId: number;
  applicantUserId: number;
  createdAt: string;
};

export type ApplicationStatusChangedEvent = {
  type: "application.status_changed";
  applicationId: number;
  vacancyId: number;
  resumeId: number;
  oldStatus: string;
  newStatus: string;
  changedAt: string;
};

export type JobSearchEvent = ApplicationCreatedEvent | ApplicationStatusChangedEvent;
