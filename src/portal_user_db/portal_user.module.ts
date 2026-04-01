import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PortalUser } from './portal_user.entity';
import { PortalUserController } from './portal_user.controller';
import { PortalUserService } from './portal_user.service';


@Module({
  imports: [TypeOrmModule.forFeature([
    PortalUser,
], 'portal')],
  providers: [PortalUserService, AesEcbService],
  controllers: [PortalUserController],
})
export class PortalUserModule {}
