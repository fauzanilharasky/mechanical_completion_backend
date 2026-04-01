import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubsystemService } from './subsystem.service';
import { Subsystem } from './subsystem.entity';
import { SubsystemController } from './subsystem.controller';
import { MasterSystem } from '../master_system/entities/master_system.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { PortalUserPermissionModule } from 'portal_permission/module/portal_permission.module';


@Module({
  imports: [TypeOrmModule.forFeature([Subsystem, MasterSystem]),
  PortalUserPermissionModule
],
  providers: [SubsystemService, AesEcbService],
  controllers: [SubsystemController],
  exports: [SubsystemService],
})
export class SubsystemModule {}
