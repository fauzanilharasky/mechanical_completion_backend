import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterTypeOfModule } from 'master_typemodule/master_typemodule.module';
import { PublicTypeModuleController } from './public_typeModule.controller';

@Module({
  imports: [MasterTypeOfModule],
  controllers: [PublicTypeModuleController],
})
export class PublicTypeModulesModule {}
