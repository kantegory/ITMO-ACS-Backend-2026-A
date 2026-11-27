import axios from 'axios';
import { settings } from '../../config/settings';
import { ActivityReportQuery, CompanyReportQuery, UserListQuery } from './admin.dto';

export class AdminService {
  private userServiceUrl: string;
  private companyServiceUrl: string;
  private orderServiceUrl: string;

  constructor() {
    this.userServiceUrl = settings.userServiceUrl;
    this.companyServiceUrl = settings.companyServiceUrl;
    this.orderServiceUrl = settings.orderServiceUrl;
  }

  async findAllUsers(query: UserListQuery): Promise<[any[], number]> {
    try {
      const response = await axios.get(`${this.userServiceUrl}/api/v1/admin/users`, {
        params: query
      });
      const data = response.data.data;
      return [data.data || [], data.pagination?.total || 0];
    } catch (error: any) {
      console.error('Error fetching users:', error.message);
      return [[], 0];
    }
  }

  async findUserById(id: number): Promise<any> {
    try {
      const response = await axios.get(`${this.userServiceUrl}/api/v1/admin/users/${id}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error('User not found');
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await axios.delete(`${this.userServiceUrl}/api/v1/admin/users/${id}`);
    } catch (error: any) {
      throw new Error('Failed to delete user');
    }
  }

  async findAllCompanies(
    page: number,
    pageSize: number,
    search?: string,
    sortBy?: string,
    sortOrder?: string
  ): Promise<[any[], number]> {
    try {
      const response = await axios.get(`${this.companyServiceUrl}/api/v1/companies`, {
        params: { page, page_size: pageSize, search, sort_by: sortBy, sort_order: sortOrder }
      });
      const data = response.data.data;
      return [data.data || [], data.pagination?.total || 0];
    } catch (error: any) {
      console.error('Error fetching companies:', error.message);
      return [[], 0];
    }
  }

  async findAllRequests(
    page: number,
    pageSize: number,
    status?: string,
    companyId?: number
  ): Promise<[any[], number]> {
    try {
      const params: any = { page, page_size: pageSize };
      if (status) params.status = status;
      if (companyId) params.company_id = companyId;
      
      const response = await axios.get(`${this.orderServiceUrl}/api/v1/admin/requests`, { params });
      const data = response.data.data;
      return [data.data || [], data.pagination?.total || 0];
    } catch (error: any) {
      console.error('Error fetching requests:', error.message);
      return [[], 0];
    }
  }

  async getActivityReport(query: ActivityReportQuery): Promise<any> {
    const { period, from, to } = query;
    
    try {
      // Параллельно собираем данные из всех сервисов
      const [usersResponse, companiesResponse, servicesResponse, requestsResponse, reviewsResponse] = await Promise.all([
        axios.get(`${this.userServiceUrl}/api/v1/admin/users/stats`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${this.companyServiceUrl}/api/v1/companies/stats`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${this.companyServiceUrl}/api/v1/services/stats`).catch(() => ({ data: { total: 0 } })),
        axios.get(`${this.orderServiceUrl}/api/v1/requests/stats`, { params: { period, from, to } }).catch(() => ({ data: { total: 0, by_status: {} } })),
        axios.get(`${this.orderServiceUrl}/api/v1/reviews/stats`).catch(() => ({ data: { total: 0 } }))
      ]);
      
      // Статистика по статусам заявок
      const requestsByStatus = {
        pending: requestsResponse.data.by_status?.PENDING || 0,
        accepted: requestsResponse.data.by_status?.ACCEPTED || 0,
        rejected: requestsResponse.data.by_status?.REJECTED || 0,
        cancelled: requestsResponse.data.by_status?.CANCELLED || 0,
      };
      
      // Топ компаний
      let topCompanies: any[] = [];
      try {
        const topResponse = await axios.get(`${this.orderServiceUrl}/api/v1/admin/top-companies`, { params: { limit: 10 } });
        topCompanies = topResponse.data.data || [];
      } catch (error) {
        console.error('Error fetching top companies:', error);
      }
      
      // Динамика новых пользователей
      let newUsersDynamics: any[] = [];
      try {
        const dynamicsResponse = await axios.get(`${this.userServiceUrl}/api/v1/admin/users/dynamics`, { params: { period, from, to } });
        newUsersDynamics = dynamicsResponse.data.data || [];
      } catch (error) {
        console.error('Error fetching user dynamics:', error);
      }
      
      // Определяем даты отчета
      let startDate: Date;
      let endDate: Date = new Date();
      
      if (from && to) {
        startDate = new Date(from);
        endDate = new Date(to);
      } else {
        startDate = new Date();
        switch (period) {
          case 'day':
            startDate.setDate(startDate.getDate() - 1);
            break;
          case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'month':
          default:
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        }
      }
      
      return {
        period: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
        },
        totals: {
          users: usersResponse.data.total || 0,
          companies: companiesResponse.data.total || 0,
          services: servicesResponse.data.total || 0,
          requests: requestsResponse.data.total || 0,
          reviews: reviewsResponse.data.total || 0,
        },
        requests_by_status: requestsByStatus,
        top_companies: topCompanies,
        new_users_dynamics: newUsersDynamics,
      };
    } catch (error: any) {
      console.error('Error generating activity report:', error.message);
      throw new Error('Failed to generate activity report');
    }
  }

  async getCompanyReport(companyId: number, query: CompanyReportQuery): Promise<any> {
    const { from, to } = query;
    
    try {
      // Получаем информацию о компании
      const companyResponse = await axios.get(`${this.companyServiceUrl}/api/v1/companies/${companyId}`);
      const company = companyResponse.data.data;
      
      if (!company) {
        throw new Error('Company not found');
      }
      
      // Получаем отчет по компании из Order Service
      const reportResponse = await axios.get(`${this.orderServiceUrl}/api/v1/companies/${companyId}/report`, {
        params: { from, to }
      });
      
      return reportResponse.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Company not found');
      }
      console.error('Error generating company report:', error.message);
      throw new Error('Failed to generate company report');
    }
  }
}