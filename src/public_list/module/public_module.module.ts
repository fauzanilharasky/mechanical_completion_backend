import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterModule } from 'master_module/master_module.entity';
import { PublicModuleController } from './public_module.controller';
import { MasterModulee } from 'master_module/master_module.module';

@Module({
  imports: [MasterModulee],
  controllers: [PublicModuleController],
})
export class PublicModulesModule {}
