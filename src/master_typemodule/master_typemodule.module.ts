import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterTypeModule } from './master_typemodule.entity';
import { MasterTypeModuleController } from './master_typemodule.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { TypeModuleService } from './master_typemodule.services';
import { PcmsMcTemplate } from 'pcms_mc_template/pcms_template.entity';


@Module({
  imports: [TypeOrmModule.forFeature([MasterTypeModule, PcmsMcTemplate])],
  providers: [TypeModuleService, AesEcbService],
  controllers: [MasterTypeModuleController],
  exports: [TypeModuleService],
})
export class MasterTypeOfModule {}
