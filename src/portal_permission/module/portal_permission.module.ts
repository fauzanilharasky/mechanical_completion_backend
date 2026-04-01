import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { portalUserPermission } from '../entities/portal_permission.entity';
import { PortalUserPermissionService } from 'portal_permission/portal_permission.services';
import { PortalUserPermissionContext } from 'portal_permission/portal_permission.context';
import { PermissionGuard } from 'portal_permission/portal_permission.guard';
import { portalPermission } from 'portal_permissions/portal_permissions.entity';
import { PortalUserPermissionController } from 'portal_permission/portal_permission.controller';


@Module({
  imports: [TypeOrmModule.forFeature([
    portalUserPermission,
    portalPermission
  ], 
    'portal')],
  controllers: [PortalUserPermissionController],
  providers: [PortalUserPermissionService, AesEcbService, PortalUserPermissionContext, PermissionGuard],
  exports: [PortalUserPermissionService, PortalUserPermissionContext, PermissionGuard],
})

export class PortalUserPermissionModule{}