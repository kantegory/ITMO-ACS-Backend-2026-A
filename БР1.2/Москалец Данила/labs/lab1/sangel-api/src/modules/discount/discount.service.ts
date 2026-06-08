import { Repository } from 'typeorm';
import { Discount } from './discount.entity';
import { Service } from '../service/service.entity';
import { AppDataSource } from '../../config/database';
import { DiscountDto } from './discount.dto';

export class DiscountService {
  private discountRepository: Repository<Discount>;
  private serviceRepository: Repository<Service>;

  constructor() {
    this.discountRepository = AppDataSource.getRepository(Discount);
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  // Получить скидку по ID услуги
  async findByServiceId(serviceId: number): Promise<Discount | null> {
    return this.discountRepository.findOne({
      where: { service_id: serviceId },
    });
  }

  // Создать скидку
  async create(serviceId: number, dto: DiscountDto): Promise<Discount> {
    // Проверяем существование услуги
    const service = await this.serviceRepository.findOne({ where: { id: serviceId } });
    if (!service) {
      throw new Error('Service not found');
    }

    // Проверяем, нет ли уже скидки
    const existing = await this.findByServiceId(serviceId);
    if (existing) {
      throw new Error('Discount already exists for this service');
    }

    const discount = this.discountRepository.create({
      service_id: serviceId,
      percentage: dto.percentage,
      start_at: new Date(dto.start_at),
      end_at: new Date(dto.end_at),
    });

    return this.discountRepository.save(discount);
  }

  // Обновить скидку
  async update(serviceId: number, dto: DiscountDto): Promise<Discount> {
    const discount = await this.findByServiceId(serviceId);
    if (!discount) {
      throw new Error('Discount not found');
    }

    discount.percentage = dto.percentage;
    discount.start_at = new Date(dto.start_at);
    discount.end_at = new Date(dto.end_at);

    return this.discountRepository.save(discount);
  }

  // Удалить скидку
  async delete(serviceId: number): Promise<void> {
    const discount = await this.findByServiceId(serviceId);
    if (!discount) {
      throw new Error('Discount not found');
    }
    await this.discountRepository.remove(discount);
  }

  // Проверить, активна ли скидка
  isActive(discount: Discount): boolean {
    const now = new Date();
    return now >= discount.start_at && now <= discount.end_at;
  }

  // Рассчитать финальную цену
  calculateFinalPrice(basePrice: number, discount: Discount | null): number {
    if (!discount || !this.isActive(discount)) {
      return basePrice;
    }
    return basePrice * (100 - discount.percentage) / 100;
  }
}