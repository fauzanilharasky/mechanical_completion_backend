import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterSystemService } from './master_system.service';
import { MasterSystemController } from './master_system.controller';
import { MasterSystem } from 'master_system/master_system.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PortalProject } from 'portal_project/portal_project.entity';
import { PortalUserPermissionModule } from 'portal_permission/module/portal_permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MasterSystem]),
    TypeOrmModule.forFeature([PortalProject], "portal"),
    PortalUserPermissionModule
],
  providers: [MasterSystemService, AesEcbService],
  controllers: [MasterSystemController],
  exports: [MasterSystemService],
})
export class MasterSystemModule {}
