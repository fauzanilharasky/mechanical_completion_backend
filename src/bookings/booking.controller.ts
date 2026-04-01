import { Controller, Get, Post, Put, Param, Body, NotFoundException, Request, Query} from '@nestjs/common';
import { Bookings } from './booking.entity';
import { BookingService } from './booking.service';
import { ServerSideDTO } from 'DTO/dto.serverside';

@Controller('api/booking')
export class BookingController {
  constructor(private readonly _booking: BookingService) {}

  @Get('/booking_list')
  async findAll(
    @Query() queryDto: ServerSideDTO
  ) {
    return await this._booking.findAll(queryDto);
  }
  
  @Get('/booking_detail/:id')
  async getDetail(@Param('id') id: number) {
    return this._booking.getDetail(id);
  }

  @Post('/create_booking')
  async submitBooking(@Body() body: Bookings, @Request() req: any) {
    body.created_by= req.user.userId
    
    await this._booking.insert_data(body);
    return {
      status: 'success',
      message: 'Data has been inserted successfully',
    };
  }

  @Put('/update_booking/:id')
  async updateBooking(@Body() body: any, @Param('id') id: number) {
    const update = this._booking.edit_data(body, id);
    return {
      status: 'success',
      message: 'Data has been Updated successfully',
    };
  }
}
