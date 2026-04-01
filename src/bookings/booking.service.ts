import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Bookings } from './booking.entity';
import { ILike, Repository } from 'typeorm';
import { ServerSideDTO } from 'DTO/dto.serverside';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Bookings) private readonly _booking: Repository<Bookings>,
  ) {}

  async findAll(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page, size } = queryDto;

      const whereConditions: any[] = [];
      const baseConditions: any = {};
      const order: any = {};
      const skip: number = ((page ?? 1) - 1) * (size ?? 10);

      if(sort){
        var orderBy = sort.split(",");
        order[orderBy[0]] = orderBy[1];
      }
      
      if(search){
        whereConditions.push({
          ...baseConditions,
          remarks: ILike(`%${search}%`),
        })
      } else {
        whereConditions.push(baseConditions);
      }
      

      const [data, total] = await this._booking.findAndCount({
        where: whereConditions,
        order: order,
        skip: skip,
        take: size ?? 10,
      });

      return {
        data: data,
        total: total,
        page: page,
        size: size ?? 10,
        total_pages: Math.ceil(total / (size ?? 10)),
      }

    } catch (error) {
      throw new Error(error);
    }
  }

  async getDetail(id: number) {
    try {
  const detail = await this._booking.findOne({ where: { id } });
      if (!detail) {
        throw new NotFoundException('No Booking Found');
      }
      return detail;
    } catch (error) {
      throw new Error(error);
    }
  }

  async insert_data(data: Bookings) {
    try {
      return await this._booking.save(data);
    } catch (error) {
      throw new Error(error);
    }
  }

  async edit_data(body: any, id: number) {
    try {
  const booking = await this._booking.findOne({ where: { id } });
      if (!booking) {
        throw new NotFoundException(`Data Booking Not Found`);
      }
      return this._booking.update(id, body);
    } catch (error) {
      throw new Error(error);
    }
  }
}
