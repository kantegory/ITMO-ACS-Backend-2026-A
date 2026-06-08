import { Repository, FindOptionsWhere } from 'typeorm';
import { Request, RequestStatus } from '../../entities/request.entity';
import axios from 'axios';
import { AppDataSource } from '../../config/database';
import { settings } from '../../config/settings';
import { CreateRequestDto, UpdateRequestStatusDto, RequestListQuery } from './request.dto';
import { publishRequestCreated, publishRequestStatusChanged } from '../../events/order.publisher';


export class RequestService {
  private requestRepository: Repository<Request>;

  constructor() {
    this.requestRepository = AppDataSource.getRepository(Request);
  }

  private async getServiceInfo(serviceId: number): Promise<any> {
    try {
      const response = await axios.get(`${settings.companyServiceUrl}/api/v1/services/${serviceId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Service not found');
      }
      throw new Error('Failed to fetch service information');
    }
  }

  private async getUserInfo(userId: number): Promise<any> {
    try {
      const response = await axios.get(`${settings.userServiceUrl}/internal/users/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      throw new Error('Failed to fetch user information');
    }
  }

  private async getCompanyByServiceId(serviceId: number): Promise<any> {
    const service = await this.getServiceInfo(serviceId);
    return service;
  }

  async findById(id: number): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: { id },
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
      where.status = status as RequestStatus;
    }

    const [requests, total] = await this.requestRepository.findAndCount({
      where,
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
    
    // Сначала получаем все услуги компании
    const servicesResponse = await axios.get(`${settings.companyServiceUrl}/api/v1/companies/${companyId}/services?page=1&page_size=100`);
    const services = servicesResponse.data.data.data || [];
    const serviceIds = services.map((s: any) => s.id);
    
    if (serviceIds.length === 0) {
      return [[], 0];
    }
    
    const qb = this.requestRepository
      .createQueryBuilder('request')
      .where('request.service_id IN (:...serviceIds)', { serviceIds });

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
    const service = await this.getServiceInfo(serviceId);
    
    // Проверяем, является ли пользователь владельцем компании
    const companyResponse = await axios.get(`${settings.companyServiceUrl}/api/v1/companies/${service.company_id}`);
    const company = companyResponse.data.data;
    
    if (company.user_id === userId) {
      throw new Error('Cannot create request for your own service');
    }

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

    const saved = await this.requestRepository.save(request);
    await publishRequestCreated(saved);
    return this.findById(saved.id);
  }

  async updateStatus(
    requestId: number,
    userId: number,
    dto: UpdateRequestStatusDto,
    isAdmin: boolean
  ): Promise<Request> {
    const request = await this.findById(requestId);
    
    const service = await this.getServiceInfo(request.service_id);
    const companyResponse = await axios.get(`${settings.companyServiceUrl}/api/v1/companies/${service.company_id}`);
    const company = companyResponse.data.data;
    
    const isOwner = company.user_id === userId;
    
    if (!isOwner && !isAdmin) {
      throw new Error('Forbidden');
    }

    const newStatus = dto.status as RequestStatus;
    
    if (!request.canChangeTo(newStatus, true)) {
      throw new Error(`Cannot change status from ${request.status} to ${dto.status}`);
    }

    request.status = newStatus;
    if (dto.reply !== undefined) {
      request.reply = dto.reply;
    }

    const saved = await this.requestRepository.save(request);
    await publishRequestStatusChanged(requestId, request.status, newStatus, userId); 
    return this.findById(saved.id);
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
    const saved = await this.requestRepository.save(request);
    return this.findById(saved.id);
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