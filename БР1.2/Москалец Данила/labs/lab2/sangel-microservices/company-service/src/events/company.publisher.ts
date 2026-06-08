import { publishEvent, Exchanges, RoutingKeys, setupExchanges } from '../../event-bus';
import { Company } from '../entities/company.entity';
import { Service } from '../entities/service.entity';

let exchangesSetup = false;

async function ensureExchanges(): Promise<void> {
  if (!exchangesSetup) {
    await setupExchanges();
    exchangesSetup = true;
  }
}

export async function publishCompanyCreated(company: Company): Promise<void> {
  await ensureExchanges();
  await publishEvent(Exchanges.COMPANY, RoutingKeys.COMPANY_CREATED, {
    companyId: company.id,
    title: company.title,
    ownerId: company.user_id,
  });
}

export async function publishServiceCreated(service: Service): Promise<void> {
  await ensureExchanges();
  await publishEvent(Exchanges.COMPANY, RoutingKeys.SERVICE_CREATED, {
    serviceId: service.id,
    name: service.name,
    price: service.base_price,
    companyId: service.company_id,
  });
}