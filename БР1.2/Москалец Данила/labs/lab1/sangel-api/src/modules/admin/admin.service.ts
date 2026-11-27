import { Repository, Between, ILike } from 'typeorm';
import { User, UserRole } from '../user/user.entity';
import { Company } from '../company/company.entity';
import { Service } from '../service/service.entity';
import { Request, RequestStatus } from '../request/request.entity';
import { Review } from '../review/review.entity';
import { AppDataSource } from '../../config/database';
import { ActivityReportQuery, CompanyReportQuery, UserListQuery } from './admin.dto';

export class AdminService {
  private userRepository: Repository<User>;
  private companyRepository: Repository<Company>;
  private serviceRepository: Repository<Service>;
  private requestRepository: Repository<Request>;
  private reviewRepository: Repository<Review>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.companyRepository = AppDataSource.getRepository(Company);
    this.serviceRepository = AppDataSource.getRepository(Service);
    this.requestRepository = AppDataSource.getRepository(Request);
    this.reviewRepository = AppDataSource.getRepository(Review);
  }

  /**
   * Получить список пользователей (с пагинацией и фильтрацией)
   */
  async findAllUsers(query: UserListQuery): Promise<[User[], number]> {
    const { page, page_size, search, role, sort_by, sort_order } = query;
    
    const where: any = {};
    
    if (search) {
      where.email = ILike(`%${search}%`);
    }
    if (role) {
      where.role = role;
    }
    
    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * page_size,
      take: page_size,
      order: { [sort_by]: sort_order },
    });
    
    return [users, total];
  }

  /**
   * Найти пользователя по ID
   */
  async findUserById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Удалить пользователя
   */
  async deleteUser(id: number): Promise<void> {
    const user = await this.findUserById(id);
    await this.userRepository.remove(user);
  }

  /**
   * Получить список компаний для администратора
   */
  async findAllCompanies(
    page: number,
    pageSize: number,
    search?: string,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<[Company[], number]> {
    const where: any = {};
    
    if (search) {
      where.title = ILike(`%${search}%`);
    }
    
    const allowedSortFields = ['created_at', 'title'];
    const orderBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    
    const [companies, total] = await this.companyRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { [orderBy]: sortOrder },
    });
    
    return [companies, total];
  }

  /**
   * Получить все заявки на платформе (с фильтрацией)
   */
  async findAllRequests(
    page: number,
    pageSize: number,
    status?: RequestStatus,
    companyId?: number
  ): Promise<[Request[], number]> {
    const qb = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('service.company', 'company')
      .leftJoinAndSelect('request.user', 'user');
    
    if (status) {
      qb.andWhere('request.status = :status', { status });
    }
    
    if (companyId) {
      qb.andWhere('company.id = :companyId', { companyId });
    }
    
    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('request.created_at', 'DESC');
    
    const [requests, total] = await qb.getManyAndCount();
    return [requests, total];
  }

  /**
   * Получить отчет по активности платформы
   */
  async getActivityReport(query: ActivityReportQuery): Promise<any> {
    const { period, from, to } = query;
    
    // Определяем даты отчета
    let startDate: Date;
    let endDate: Date = new Date();
    
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
        default:
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }
    }
    
    // Общая статистика
    const [totalUsers, totalCompanies, totalServices, totalRequests, totalReviews] = await Promise.all([
      this.userRepository.count(),
      this.companyRepository.count(),
      this.serviceRepository.count(),
      this.requestRepository.count(),
      this.reviewRepository.count(),
    ]);
    
    // Статистика по статусам заявок
    const requestsByStatus = {
      pending: await this.requestRepository.count({ where: { status: RequestStatus.PENDING } }),
      accepted: await this.requestRepository.count({ where: { status: RequestStatus.ACCEPTED } }),
      rejected: await this.requestRepository.count({ where: { status: RequestStatus.REJECTED } }),
      cancelled: await this.requestRepository.count({ where: { status: RequestStatus.CANCELLED } }),
    };
    
    // Топ компаний по принятым заявкам
    const topCompanies = await this.requestRepository
      .createQueryBuilder('request')
      .leftJoin('request.service', 'service')
      .leftJoin('service.company', 'company')
      .select('company.id', 'id')
      .addSelect('company.title', 'title')
      .addSelect('COUNT(request.id)', 'requests_accepted')
      .where('request.status = :status', { status: RequestStatus.ACCEPTED })
      .groupBy('company.id')
      .addGroupBy('company.title')
      .orderBy('requests_accepted', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Динамика новых пользователей
    const newUsersDynamics = await this.userRepository
      .createQueryBuilder('user')
      .select("DATE_TRUNC(:period, user.created_at) as date", 'date')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.created_at BETWEEN :startDate AND :endDate', { startDate, endDate })
      .setParameter('period', period === 'day' ? 'day' : period === 'week' ? 'week' : 'month')
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();
    
    // Обогащаем топ компаний рейтингами
    const enrichedTopCompanies = await Promise.all(
      topCompanies.map(async (company) => {
        const rating = await this.getCompanyRating(company.id);
        return {
          id: company.id,
          title: company.title,
          requests_accepted: parseInt(company.requests_accepted),
          avg_rating: rating.avg_rating,
        };
      })
    );
    
    return {
      period: {
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
      },
      totals: {
        users: totalUsers,
        companies: totalCompanies,
        services: totalServices,
        requests: totalRequests,
        reviews: totalReviews,
      },
      requests_by_status: requestsByStatus,
      top_companies: enrichedTopCompanies,
      new_users_dynamics: newUsersDynamics.map((item: any) => ({
        date: item.date.toISOString().split('T')[0],
        count: parseInt(item.count),
      })),
    };
  }

  /**
   * Получить отчет по компании
   */
  async getCompanyReport(companyId: number, query: CompanyReportQuery): Promise<any> {
    const { from, to } = query;
    
    // Проверяем существование компании
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Определяем даты отчета
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    if (from) startDate = new Date(from);
    if (to) endDate = new Date(to);
    
    // Строим запрос для заявок
    const requestQb = this.requestRepository
      .createQueryBuilder('request')
      .leftJoin('request.service', 'service')
      .where('service.company_id = :companyId', { companyId });
    
    if (startDate) {
      requestQb.andWhere('request.created_at >= :startDate', { startDate });
    }
    if (endDate) {
      requestQb.andWhere('request.created_at <= :endDate', { endDate });
    }
    
    // Общее количество заявок
    const totalRequests = await requestQb.getCount();
    
    // Статистика по статусам
    const requestsByStatus = {
      pending: await requestQb.clone().andWhere('request.status = :status', { status: RequestStatus.PENDING }).getCount(),
      accepted: await requestQb.clone().andWhere('request.status = :status', { status: RequestStatus.ACCEPTED }).getCount(),
      rejected: await requestQb.clone().andWhere('request.status = :status', { status: RequestStatus.REJECTED }).getCount(),
      cancelled: await requestQb.clone().andWhere('request.status = :status', { status: RequestStatus.CANCELLED }).getCount(),
    };
    
    // Топ услуг по количеству заявок
    const topServices = await this.requestRepository
      .createQueryBuilder('request')
      .leftJoin('request.service', 'service')
      .select('service.id', 'service_id')
      .addSelect('service.name', 'name')
      .addSelect('COUNT(request.id)', 'requests_count')
      .where('service.company_id = :companyId', { companyId })
      .groupBy('service.id')
      .addGroupBy('service.name')
      .orderBy('requests_count', 'DESC')
      .limit(10)
      .getRawMany();
    
    // Обогащаем топ услуг рейтингами
    const enrichedTopServices = await Promise.all(
      topServices.map(async (service) => {
        const rating = await this.getServiceRating(service.service_id);
        return {
          service_id: service.service_id,
          name: service.name,
          requests_count: parseInt(service.requests_count),
          avg_rating: rating.avg_rating,
        };
      })
    );
    
    // Рейтинг компании
    const companyRating = await this.getCompanyRating(companyId);
    
    return {
      company_id: companyId,
      period: {
        from: startDate?.toISOString().split('T')[0] || 'all',
        to: endDate?.toISOString().split('T')[0] || 'all',
      },
      requests_total: totalRequests,
      requests_by_status: requestsByStatus,
      top_services: enrichedTopServices,
      avg_rating: companyRating.avg_rating,
      total_reviews: companyRating.total_reviews,
    };
  }

  /**
   * Получить рейтинг компании
   */
  private async getCompanyRating(companyId: number): Promise<{ avg_rating: number | null; total_reviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.service', 'service')
      .where('service.company_id = :companyId', { companyId })
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .getRawOne();
    
    return {
      avg_rating: result?.avg_rating ? parseFloat(result.avg_rating) : null,
      total_reviews: result?.total_reviews ? parseInt(result.total_reviews) : 0,
    };
  }

  /**
   * Получить рейтинг услуги
   */
  private async getServiceRating(serviceId: number): Promise<{ avg_rating: number | null; total_reviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.service_id = :serviceId', { serviceId })
      .select('AVG(review.rating)', 'avg_rating')
      .addSelect('COUNT(review.id)', 'total_reviews')
      .getRawOne();
    
    return {
      avg_rating: result?.avg_rating ? parseFloat(result.avg_rating) : null,
      total_reviews: result?.total_reviews ? parseInt(result.total_reviews) : 0,
    };
  }
}