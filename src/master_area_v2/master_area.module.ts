import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterArea } from './master_area.entity';
import { MasterAreaService } from './master_area.services';
import { MasterAreaController } from './master_area.controller';
import { AesEcbService } from 'crypto/aes-ecb.service';


@Module({
  imports: [TypeOrmModule.forFeature([MasterArea])],
  providers: [MasterAreaService, AesEcbService],
  controllers: [MasterAreaController],
  exports: [MasterAreaService],
})
export class MasterAreaModule {}
