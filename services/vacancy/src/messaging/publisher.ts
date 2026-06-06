import amqp from "amqplib";
import { env } from "../config/env";
import { Vacancy } from "../entities/Vacancy";

const EXCHANGE = "vacancies.events";

export async function publishVacancyPublished(vacancy: Vacancy): Promise<void> {
  const conn = await amqp.connect(env.rabbitmqUrl);
  try {
    const channel = await conn.createChannel();
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    const message = {
      event: "vacancy.published",
      timestamp: new Date().toISOString(),
      payload: {
        vacancy_id: vacancy.id,
        company_id: vacancy.companyId,
        title: vacancy.title,
        industry: vacancy.industry,
        status: vacancy.status,
      },
    };
    channel.publish(
      EXCHANGE,
      "vacancy.published",
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );
    await channel.close();
  } finally {
    await conn.close();
  }
}
