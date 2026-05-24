import dataSource from '../config/data-source';
import { ApplicationCreatedEventLog } from '../models/application-created-event.entity';
import {
    ApplicationCreatedEvent,
    startApplicationCreatedConsumer,
} from '../common/rabbitmq';

export async function startConsumers(): Promise<void> {
    await startApplicationCreatedConsumer(handleApplicationCreated);
}

async function handleApplicationCreated(
    event: ApplicationCreatedEvent,
): Promise<void> {
    const repository = dataSource.getRepository(ApplicationCreatedEventLog);
    const existingEvent = await repository.findOneBy({ eventId: event.eventId });

    if (existingEvent) {
        console.log(
            `application.created event ${event.eventId} was already processed`,
        );
        return;
    }

    await repository.save(
        repository.create({
            eventId: event.eventId,
            eventType: event.eventType,
            occurredAt: new Date(event.occurredAt),
            applicationId: event.payload.applicationId,
            vacancyId: event.payload.vacancyId,
            applicantId: event.payload.applicantId,
            resumeId: event.payload.resumeId,
            status: event.payload.status,
        }),
    );

    console.log(
        `Stored notification for application ${event.payload.applicationId}`,
    );
}
