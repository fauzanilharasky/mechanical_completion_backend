import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterPhase } from './master_phase.entity';
import { MasterPhaseService } from 'master_phase/master_phase.services';
import { MasterPhaseController } from './master_phase.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';

@Module({
  imports: [TypeOrmModule.forFeature([MasterPhase])],
  providers: [MasterPhaseService, AesEcbService],
  controllers: [MasterPhaseController],
  exports: [MasterPhaseService],
})
export class MasterPhaseModule {}
