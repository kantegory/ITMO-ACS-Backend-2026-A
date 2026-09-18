import * as amqp from 'amqplib';

import SETTINGS from './config/settings';
import dataSource from './config/data-source';

import {
    ApplicationResponse,
} from './models/response.entity';


export async function startVacancyDeletedConsumer() {

    //подключаемся к RabbitMQ
    const connection = await amqp.connect(SETTINGS.RABBITMQ_URL);

    //создаем канал
    const channel = await connection.createChannel();

    const queue = 'vacancy.deleted';

    await channel.assertQueue(
        queue,
        {
            durable: true,
        },
    );
    //устанавливаем prefetch 1, чтобы обрабатывать по одному сообщению за раз
    await channel.prefetch(1);

    console.log('RabbitMQ: waiting for vacancy.deleted');

    //подписываемся на очередь vacancy.deleted и обрабатываем сообщения
    channel.consume(queue, async (message) => {
        if (!message) {return}


        let data;
        //парсим сообщение из очереди vacancy.deleted
        try {
            data = JSON.parse(
                message.content.toString(),
            );
        } catch {
            console.log('RabbitMQ: invalid message');

            channel.ack(message);

            return;
        }

        const vacancyId = data.vacancy_id;

        //удаляем все отклики на вакансию с vacancyId из очереди vacancy.deleted
        try {
            const responseRepository =
                dataSource.getRepository(
                    ApplicationResponse,
                );

            const result = await responseRepository.delete({
                vacancyId: vacancyId,
            });


            console.log(
                'RabbitMQ: vacancy.deleted',
                {
                    vacancy_id:vacancyId,
    
                    deleted_responses: result.affected,
                },
            );


            channel.ack(message);
        //если произошла ошибка при удалении откликов на вакансию, то выводим ошибку в консоль и отправляем сообщение обратно в очередь vacancy.deleted, чтобы его можно было обработать позже
        } catch (error) {

            console.error(
                'RabbitMQ consumer error:',
                error,
            );
            //отправляем сообщение обратно в очередь vacancy.deleted, чтобы его можно было обработать позже
            channel.nack(message, false, true);
        }
        },
    );
}
