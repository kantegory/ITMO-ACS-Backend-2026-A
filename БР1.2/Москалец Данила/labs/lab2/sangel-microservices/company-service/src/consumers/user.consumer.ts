import { setupConsumer, Queues, Exchanges, RoutingKeys } from '../../event-bus';

export async function startCompanyConsumer(): Promise<void> {
  const bindings = [
    { exchange: Exchanges.USER, routingKey: RoutingKeys.USER_ROLE_UPDATED },
  ];
  
  await setupConsumer(Queues.COMPANY, bindings, async (data, routingKey) => {
    console.log(`📥 Company Service received: ${routingKey}`, data);
    // TODO: Обновить кэш владельцев компаний
  });
  
  console.log('Company Service: Consumer ready');
}