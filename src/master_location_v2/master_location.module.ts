import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { MasterLocationService } from './master_location.services';
import { MasterLocationController } from './master_location.controller';
import { MasterLocation } from './master_location.entity';
import { MasterArea } from 'master_area_v2/master_area.entity';


@Module({
  imports: [TypeOrmModule.forFeature([
    MasterLocation,
    MasterArea,
     
])],
  providers: [MasterLocationService, AesEcbService],
  controllers: [MasterLocationController],
  exports: [MasterLocationService],
})
export class MasterLocationModule {}