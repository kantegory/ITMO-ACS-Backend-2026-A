import { AsyncLocalStorage } from 'async_hooks';

// Сквозной идентификатор запроса: доступен в любом месте обработки без передачи параметром
export const als = new AsyncLocalStorage<{ requestId: string }>();
export const currentRequestId = (): string | undefined => als.getStore()?.requestId;
