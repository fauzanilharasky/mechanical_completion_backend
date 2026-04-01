import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterDiscipline } from '../../master_discipline/master_discipline.entity';
import { MasterDisciplineService } from '../../master_discipline/master_discipline.services';
import { PublicDisciplineController } from './public_discipline.controller';
import { MasterDisciplineModule } from 'master_discipline/master_discipline.module';

@Module({
  imports: [
    MasterDisciplineModule,
  ],
  controllers: [PublicDisciplineController],
})
export class PublicDisciplineModule {}
