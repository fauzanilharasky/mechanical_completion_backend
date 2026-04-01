import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { portalRoleDB } from './portal_role.entity';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { PortalRoleDBController } from './portal_role.controller';
import { PortalRoleDBService } from './portal_role.service';


@Module({
  imports: [TypeOrmModule.forFeature([portalRoleDB], 'portal')],
  controllers: [PortalRoleDBController],
  providers: [PortalRoleDBService, AesEcbService],
  exports: [PortalRoleDBService],
})

export class PortalRoleDBModule{}