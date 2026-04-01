import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubsystemModule } from 'master_subsystem/subsystem.module';
import { PublicSubsystemController } from './public_subsystem.controller';
import { MasterSystem } from 'master_system/master_system.entity';

@Module({
  imports: [SubsystemModule, MasterSystem],
  controllers: [PublicSubsystemController],
})
export class PublicSubsystemModule {}
