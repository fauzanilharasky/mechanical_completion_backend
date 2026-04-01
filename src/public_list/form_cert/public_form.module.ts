import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterModule } from 'master_module/master_module.entity';
import { MasterFormModule } from 'master_form/master_form.module';
import { PublicFormController } from './public_form.controller';

@Module({
  imports: [MasterFormModule],
  controllers: [PublicFormController],
})
export class PublicFormModule {}
