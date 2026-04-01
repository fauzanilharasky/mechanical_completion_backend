import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicPhaseController } from './public_phase.controller';
import { MasterPhaseModule } from 'master_phase/master_phase.module';

@Module({
  imports: [
    MasterPhaseModule,
  ],
  controllers: [PublicPhaseController],
})
export class PublicPhaseModule {}
