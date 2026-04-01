import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookings } from './booking.entity';
import { BookingController } from './booking.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bookings])],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
