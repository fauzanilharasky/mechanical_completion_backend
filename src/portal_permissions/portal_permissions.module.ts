import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { portalPermission } from './portal_permissions.entity';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { PortalPermissionsService } from './portal_permissions.service';
import { portalPermissionController } from './portal_permissions.controller';
import { portalAppPermission } from 'portal_app_permission/portal_app.entity';


@Module({
  imports: [TypeOrmModule.forFeature([
    portalPermission,
    portalAppPermission,
  ], 
    'portal')],
  controllers: [portalPermissionController],
  providers: [PortalPermissionsService, AesEcbService],
  exports: [PortalPermissionsService],
})

export class PortalPermissionsModule{}