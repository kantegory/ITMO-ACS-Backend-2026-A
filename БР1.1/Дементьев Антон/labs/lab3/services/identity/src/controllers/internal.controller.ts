import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { Body, Get, JsonController, Post, Req } from 'routing-controllers';
import { In } from 'typeorm';
import crypto from 'crypto';
import { fail, RequestWithUser, SERVICE_NAMES } from '@jobsearch/common';

import { dataSource } from '../db';
import { jwks, sign } from '../keys';
import { ServiceClient } from '../models/service-client.entity';
import { UserProfile } from '../models/user-profile.entity';
import { User } from '../models/user.entity';
import { sha256 } from '../utils/tokens';

class ServiceTokenDto {
    @IsString() @Length(1, 100) client_id: string;
    @IsString() @Length(16, 128) client_secret: string;
    @IsIn([...SERVICE_NAMES]) audience: string;
}
class UserLookupDto {
    @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsUUID('all', { each: true }) ids: string[];
    @IsOptional() @IsBoolean() include_contacts?: boolean;
}

@JsonController('/internal/v1')
class InternalController {
    // Выдача сервисного токена (client credentials): токен живёт 5 минут и выдаётся для одного сервиса-получателя
    @Post('/auth/service-token')
    async serviceToken(@Body({ type: ServiceTokenDto }) body: ServiceTokenDto) {
        const client = await dataSource.getRepository(ServiceClient).findOneBy({ clientId: body.client_id });
        const given = Buffer.from(sha256(body.client_secret));
        const expected = Buffer.from(client?.secretHash || sha256('none'));
        if (!client || !client.isActive || given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) throw fail('INVALID_CLIENT');
        if (!client.allowedAudiences.includes(body.audience)) throw fail('AUDIENCE_NOT_ALLOWED');
        return { access_token: sign({ typ: 'service', sub: client.clientId, aud: body.audience }, 300), token_type: 'Bearer', expires_in: 300, audience: body.audience };
    }

    @Get('/.well-known/jwks.json')
    getJwks() { return jwks(); }

    // Пакетное получение пользователей. Контакты отдаются только application-service.
    @Post('/users/lookup')
    async lookup(@Req() req: RequestWithUser, @Body({ type: UserLookupDto }) body: UserLookupDto) {
        if (body.include_contacts && req.serviceClient !== 'application-service') throw fail('SERVICE_FORBIDDEN');
        const ids = Array.from(new Set(body.ids));
        const users = await dataSource.getRepository(User).find({ where: { id: In(ids) } });
        const profiles = await dataSource.getRepository(UserProfile).find({ where: { userId: In(ids) } });
        const pmap = new Map(profiles.map((p) => [p.userId, p]));
        const items = users.map((u) => {
            const p = pmap.get(u.id);
            const base: any = { id: u.id, role: u.role, is_active: u.isActive, last_name: p?.lastName ?? '', first_name: p?.firstName ?? '', middle_name: p?.middleName ?? null };
            if (body.include_contacts) { base.email = u.email; base.phone = p?.phone ?? null; base.city = p?.city ?? null; }
            return base;
        });
        const found = new Set(users.map((u) => u.id));
        return { items, missing_ids: ids.filter((i) => !found.has(i)) };
    }
}
export default InternalController;
