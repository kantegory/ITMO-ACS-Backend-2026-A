import { IsEmail } from 'class-validator';

import { Trim } from './common';

export class MailboxQuery {
    @Trim()
    @IsEmail()
    email: string;
}
