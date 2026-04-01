import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterModuleController } from './master_module.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { MasterModuleService } from './master_module.services';
import { MasterModule } from './master_module.entity';
import { PortalProject } from 'portal_project/portal_project.entity';



@Module({
  imports: [
    TypeOrmModule.forFeature([MasterModule]),
    TypeOrmModule.forFeature([PortalProject], "portal"),
  ],
  providers: [MasterModuleService, AesEcbService],
  controllers: [MasterModuleController],
  exports: [MasterModuleService],
})
export class MasterModulee {}
