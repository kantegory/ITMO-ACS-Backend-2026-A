import { Body, Get, Param, Post, UseBefore } from 'routing-controllers';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';
import internalAuthMiddleware from '../middlewares/internal-auth.middleware';
import { ensureFound } from '../common/http-errors';
import { Company } from '../models/company.entity';
import { EmployerProfile } from '../models/employer-profile.entity';

@EntityController({
    baseRoute: '/internal/v1',
    entity: Company,
})
class InternalCompanyController extends BaseController {
    private employerProfileRepository =
        dataSource.getRepository(EmployerProfile);

    @Post('/companies/batch')
    @UseBefore(internalAuthMiddleware)
    async getCompaniesBatch(@Body() body: { ids?: string[] }) {
        const ids = [...new Set(body.ids ?? [])];
        const companies = ids.length
            ? await this.repository.findBy({ id: In(ids) })
            : [];
        const foundIds = new Set(companies.map((company) => company.id));

        return {
            items: companies,
            missingIds: ids.filter((id) => !foundIds.has(id)),
        };
    }

    @Post('/employer-profiles/batch')
    @UseBefore(internalAuthMiddleware)
    async getEmployerProfilesBatch(@Body() body: { ids?: string[] }) {
        const ids = [...new Set(body.ids ?? [])];
        const profiles = ids.length
            ? await this.employerProfileRepository.findBy({ id: In(ids) })
            : [];
        const foundIds = new Set(profiles.map((profile) => profile.id));

        return {
            items: profiles,
            missingIds: ids.filter((id) => !foundIds.has(id)),
        };
    }

    @Get('/employer-profiles/by-user/:user_id')
    @UseBefore(internalAuthMiddleware)
    async getEmployerProfileByUser(@Param('user_id') userId: string) {
        return ensureFound(
            await this.employerProfileRepository.findOneBy({ userId }),
            'Employer profile not found',
        );
    }
}

export default InternalCompanyController;
