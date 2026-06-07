// src/modules/request/request.service.ts
import { Repository, FindOptionsWhere } from 'typeorm';
import { Request, RequestStatus } from './request.entity';
import { Service } from '../service/service.entity';
import { AppDataSource } from '../../config/database';
import { CreateRequestDto, UpdateRequestStatusDto, RequestListQuery } from './request.dto';

export class RequestService {
  private requestRepository: Repository<Request>;
  private serviceRepository: Repository<Service>;

  constructor() {
    this.requestRepository = AppDataSource.getRepository(Request);
    this.serviceRepository = AppDataSource.getRepository(Service);
  }

  async findById(id: number): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['service', 'service.company', 'user'],
    });
    if (!request) {
      throw new Error('Request not found');
    }
    return request;
  }

  async findUserRequests(
    userId: number,
    query: RequestListQuery
  ): Promise<[Request[], number]> {
    const { page, page_size, status, sort_by, sort_order } = query;
    
    const where: FindOptionsWhere<Request> = { user_id: userId };
    if (status) {
      // Исправлено: преобразуем строку в enum RequestStatus
      where.status = status as RequestStatus;
    }

    const [requests, total] = await this.requestRepository.findAndCount({
      where,
      relations: ['service', 'service.company', 'user'],
      skip: (page - 1) * page_size,
      take: page_size,
      order: { [sort_by]: sort_order },
    });

    return [requests, total];
  }

  async findCompanyRequests(
    companyId: number,
    query: RequestListQuery
  ): Promise<[Request[], number]> {
    const { page, page_size, status, sort_by, sort_order } = query;
    
    const qb = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('service.company', 'company')
      .leftJoinAndSelect('request.user', 'user')
      .where('company.id = :companyId', { companyId });

    if (status) {
      qb.andWhere('request.status = :status', { status });
    }

    qb.skip((page - 1) * page_size)
      .take(page_size)
      .orderBy(`request.${sort_by}`, sort_order.toUpperCase() as 'ASC' | 'DESC');

    const [requests, total] = await qb.getManyAndCount();
    return [requests, total];
  }

  async create(userId: number, serviceId: number, dto: CreateRequestDto): Promise<Request> {
    // Проверяем существование услуги
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
      relations: ['company'],
    });
    if (!service) {
      throw new Error('Service not found');
    }

    // Нельзя создать заявку на услугу своей компании
    const company = service.company;
    const isOwner = company.user_id === userId;
    if (isOwner) {
      throw new Error('Cannot create request for your own service');
    }

    // Проверяем, нет ли уже активной заявки (PENDING)
    const existing = await this.requestRepository.findOne({
      where: {
        user_id: userId,
        service_id: serviceId,
        status: RequestStatus.PENDING,
      },
    });
    if (existing) {
      throw new Error('You already have a pending request for this service');
    }

    const request = this.requestRepository.create({
      user_id: userId,
      service_id: serviceId,
      description: dto.description || null,
      status: RequestStatus.PENDING,
    });

    return this.requestRepository.save(request);
  }

  async updateStatus(
    requestId: number,
    userId: number,
    dto: UpdateRequestStatusDto,
    isAdmin: boolean
  ): Promise<Request> {
    const request = await this.findById(requestId);
    
    // Проверяем, является ли пользователь владельцем компании
    const isOwner = request.service.company.user_id === userId;
    
    if (!isOwner && !isAdmin) {
      throw new Error('Forbidden');
    }

    // Исправлено: преобразуем строку в enum RequestStatus
    const newStatus = dto.status as RequestStatus;
    
    if (!request.canChangeTo(newStatus, true)) {
      throw new Error(`Cannot change status from ${request.status} to ${dto.status}`);
    }

    request.status = newStatus;
    if (dto.reply !== undefined) {
      request.reply = dto.reply;
    }

    return this.requestRepository.save(request);
  }

  async cancel(requestId: number, userId: number): Promise<Request> {
    const request = await this.findById(requestId);
    
    if (request.user_id !== userId) {
      throw new Error('Forbidden');
    }

    if (!request.canChangeTo(RequestStatus.CANCELLED, false)) {
      throw new Error(`Cannot cancel request in ${request.status} status`);
    }

    request.status = RequestStatus.CANCELLED;
    return this.requestRepository.save(request);
  }

  async hasAcceptedRequest(userId: number, serviceId: number): Promise<boolean> {
    const request = await this.requestRepository.findOne({
      where: {
        user_id: userId,
        service_id: serviceId,
        status: RequestStatus.ACCEPTED,
      },
    });
    return !!request;
  }
}