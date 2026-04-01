import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../jwt.strategy';
import { User } from '../portal/user.entity';
import { CryptoModule } from '../crypto/crypto.module';
import { PortalUserPermissionModule } from 'portal_permission/module/portal_permission.module';
import { PortalUserModule } from 'portal_user_db/portal_user.module';
import { PortalUser } from 'portal_user_db/portal_user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TypeOrmModule.forFeature([User, PortalUser], 'portal'),
    CryptoModule,
    PortalUserPermissionModule,
    PortalUserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
