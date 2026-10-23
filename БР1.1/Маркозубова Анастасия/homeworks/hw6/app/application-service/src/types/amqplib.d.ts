declare module 'amqplib' {
    export interface ConsumeMessage {
        content: Buffer;
    }

    export interface Channel {
        assertExchange(exchange: string, type: string, options?: Record<string, unknown>): Promise<void>;
        assertQueue(queue: string, options?: Record<string, unknown>): Promise<void>;
        bindQueue(queue: string, exchange: string, pattern: string): Promise<void>;
        publish(exchange: string, routingKey: string, content: Buffer): boolean;
        consume(queue: string, onMessage: (message?: ConsumeMessage | null) => void): Promise<void>;
        ack(message: ConsumeMessage): void;
    }

    export interface Connection {
        createChannel(): Promise<Channel>;
    }

    const amqplib: {
        connect(url: string): Promise<Connection>;
    };

    export default amqplib;
}
