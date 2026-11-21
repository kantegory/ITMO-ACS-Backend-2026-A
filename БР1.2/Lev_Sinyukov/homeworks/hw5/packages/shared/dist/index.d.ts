import amqplib, { Channel } from "amqplib";
export declare const EXCHANGE_NAME = "restaurant.booking.topic";
export declare const DEFAULT_TIMEOUT_MS = 5000;
export type ServiceHealth = {
    service: string;
    status: "ok";
    timestamp: string;
};
export type ApiErrorBody = {
    code: string;
    message: string;
    trace_id: string;
    details?: Array<{
        field: string;
        issue: string;
    }>;
};
export type RpcHandler<TRequest, TResponse> = (payload: TRequest) => Promise<TResponse> | TResponse;
export type RpcClient = {
    request<TRequest, TResponse>(routingKey: string, payload: TRequest, timeoutMs?: number): Promise<TResponse>;
};
export declare const buildHealth: (service: string) => ServiceHealth;
export declare const buildError: (code: string, message: string, details?: ApiErrorBody["details"]) => ApiErrorBody;
export declare const delay: (ms: number) => Promise<unknown>;
export declare function connectRabbit(serviceName: string, amqpUrl?: string): Promise<{
    connection: amqplib.ChannelModel;
    channel: amqplib.Channel;
}>;
export declare function createRpcClient(channel: Channel, replyQueueName?: string): Promise<RpcClient>;
export declare function registerRpcHandler<TRequest, TResponse>(channel: Channel, queueName: string, routingKey: string, handler: RpcHandler<TRequest, TResponse>): Promise<void>;
export declare function parseRpcResult<T extends {
    ok?: boolean;
    error?: string;
}>(payload: T): T;
export type Restaurant = {
    id: number;
    name: string;
    city: string;
    cuisines: string[];
    price_range: number;
    is_active: boolean;
};
export type UserValidationRequest = {
    user_id: number;
};
export type UserValidationResponse = {
    ok: true;
    exists: boolean;
    is_active: boolean;
    email?: string;
};
export type RestaurantSearchRequest = {
    name?: string;
    cuisine?: string;
    city?: string;
    min_price_range?: number;
    max_price_range?: number;
};
export type RestaurantSearchResponse = {
    ok: true;
    items: Restaurant[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
};
export type TableValidationRequest = {
    restaurant_id: number;
    table_id: number;
    guests_count: number;
};
export type TableValidationResponse = {
    ok: true;
    exists: boolean;
    is_active: boolean;
    seats_count: number;
};
export type ReviewSummaryRequest = {
    restaurant_id: number;
};
export type ReviewSummaryResponse = {
    ok: true;
    restaurant_id: number;
    average_rating: number;
    reviews_count: number;
};
export type ReservationAvailabilityRequest = {
    user_id: number;
    restaurant_id: number;
    table_id: number;
    reservation_start: string;
    reservation_end: string;
    guests_count: number;
};
export type ReservationAvailabilityResponse = {
    ok: true;
    available: boolean;
    reason: "OK" | "USER_NOT_FOUND" | "USER_INACTIVE" | "TABLE_NOT_FOUND" | "TABLE_INACTIVE" | "CAPACITY_EXCEEDED" | "INVALID_TIME_RANGE";
};
