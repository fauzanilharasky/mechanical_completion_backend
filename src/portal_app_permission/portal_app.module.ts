import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { portalAppPermission } from './portal_app.entity';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { PortalAppPermissionService } from './portal_app.services';
import { PortalAppPermissionController } from './portal_app.controller';


@Module({
  imports: [TypeOrmModule.forFeature([portalAppPermission], 'portal')],
  controllers: [PortalAppPermissionController],
  providers: [PortalAppPermissionService, AesEcbService],
  exports: [PortalAppPermissionService],
})

export class PortalAppPermissionModule{}