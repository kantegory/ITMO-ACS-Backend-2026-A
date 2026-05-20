import { HttpError } from 'routing-controllers';
import SETTINGS from '../config/settings';

type ServiceKey =
    | 'auth'
    | 'profile'
    | 'resume'
    | 'vacancy'
    | 'application'
    | 'reference';

const serviceUrls: Record<ServiceKey, string> = {
    auth: SETTINGS.AUTH_SERVICE_URL,
    profile: SETTINGS.PROFILE_SERVICE_URL,
    resume: SETTINGS.RESUME_SERVICE_URL,
    vacancy: SETTINGS.VACANCY_SERVICE_URL,
    application: SETTINGS.APPLICATION_SERVICE_URL,
    reference: SETTINGS.REFERENCE_SERVICE_URL,
};

export async function requestService<T>(
    service: ServiceKey,
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const baseUrl = serviceUrls[service].replace(/\/$/, '');
    const response = await fetch(`${baseUrl}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        let message = `${service} service request failed`;

        try {
            const errorBody = await response.json();
            message = errorBody.message || message;
        } catch (_error) {
            // The caller only needs a stable HTTP error.
        }

        throw new HttpError(response.status, message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return (await response.json()) as T;
}

export async function assertExists(
    service: ServiceKey,
    path: string,
    message: string,
): Promise<void> {
    try {
        await requestService(service, path);
    } catch (error: any) {
        if (error?.httpCode === 404) {
            throw new HttpError(404, message);
        }
        throw error;
    }
}
