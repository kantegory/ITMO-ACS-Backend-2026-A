import * as amqp from 'amqplib';
import { Channel } from 'amqplib';

import SETTINGS from './config/settings';


let channel: Channel | null = null;

//получаем канал 
async function getChannel(): Promise<Channel> {
    if (channel) {return channel}

    const connection = await amqp.connect(
            SETTINGS.RABBITMQ_URL,
        );

    channel = await connection.createChannel();

    return channel;
}

//подключаемя к RabbitMQ 
export async function publishVacancyDeleted(
    vacancyId: number,
) {
    const rabbitChannel = await getChannel();

    //создаем очередь vacancy.deleted
    const queue = 'vacancy.deleted';
    //создаем очередь vacancy.deleted если она не существует
    await rabbitChannel.assertQueue(
        queue,
        {
            durable: true,
        },
    );
    //создаем сообщение с vacancyId которое будет отправлено в очередь vacancy.deleted
    const message = {vacancy_id: vacancyId};
    //отправляем сообщение в очередь vacancy.deleted
    rabbitChannel.sendToQueue(
        queue,
        Buffer.from(
            JSON.stringify(message),
        ),
        {
            persistent: true,
        },
    );
    //выводим в консоль сообщение о том что сообщение было отправлено в очередь vacancy.deleted
    console.log(
        'RabbitMQ: vacancy.deleted',
        message,
    );
}

