import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterDiscipline } from './master_discipline.entity';
import { MasterDisciplineService } from 'master_discipline/master_discipline.services';
import { MasterDisciplineController } from './master_discipline.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';

@Module({
  imports: [TypeOrmModule.forFeature([MasterDiscipline])],
  providers: [MasterDisciplineService, AesEcbService],
  controllers: [MasterDisciplineController],
  exports: [MasterDisciplineService],
})
export class MasterDisciplineModule {}
