import { NotificationsEmailController } from './notifications_email.controller';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { NotificationsEmailService } from './notifications_email.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsEmail } from './notifications_email.entity';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { config } from 'process';

@Module({
    imports: [
        TypeOrmModule.forFeature([NotificationsEmail], 'portal'),
        MailerModule.forRootAsync({
            useFactory: (ConfigService: ConfigService) => ({
                transport : {
                    host: ConfigService.get('MAIL.HOST'),
                    secure: true,
                    port: 465,
                    auth: {
                        user: ConfigService.get('MAIL_USER'),
                        pass: ConfigService.get('MAIL_PASS'),
                    },
                },
            }),
            inject: [ConfigService],
        })
    
    ],
    controllers: [NotificationsEmailController],
    providers: [NotificationsEmailService],
    exports: [NotificationsEmailService]
})
export class NotificationsEmailModule {}
