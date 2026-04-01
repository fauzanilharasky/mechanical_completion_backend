import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { MasterLocation } from './master_location.entity';
import { MasterArea } from 'master_area_v2/master_area.entity';
import { Server } from 'http';
import { ServerSideDTO } from 'DTO/dto.serverside';

@Injectable()
export class MasterLocationService {
  constructor(
    @InjectRepository(MasterLocation)
    private readonly locationRepo: Repository<MasterLocation>,

    @InjectRepository(MasterArea)
    private readonly MasterAreaRepo: Repository<MasterArea>,
  ) {}

  async selectLocations() {
       const data = await this.locationRepo.find({
        where: { 
          id: Not(0),
          category: 1, 
        },
        order: { name: "ASC" },
        select: ["id", "name"],
      });
  
      return {
        success: true,
        data,
      };
    }



  async dropdown(areaId: number) {
    try {
      const locations = await this.locationRepo.find({
        where: { id_area: areaId },   // pakai parameter areaId
        select: ['id', 'name'],
        order: { name: 'ASC' },
      });

      return { success: true, data: locations };
    } catch (error) {
      throw new Error('Failed to fetch location dropdown: ' + error.message);
    }
  }


// PUBLIC DATA LIST

async locationList(queryDto : ServerSideDTO) {

  try {
   const { sort, page = 1, size = 10, ...filters } = queryDto;

    const take = Number(size);
    const skip = (Number(page) - 1) * take;

    const qb = this.locationRepo.createQueryBuilder('location')
      .leftJoinAndSelect('location.area', 'area');

    // ---------------- SEARCH / FILTER ----------------
    const columnMap: Record<string, string> = {
      name: 'location.name',
      area: 'area.name',
    };

    Object.keys(filters).forEach((key) => {
      if (!filters[key]) return;

      const column = columnMap[key];
      if (!column) return;

      qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
        [key]: `%${filters[key]}%`,
      });
    });

    // ---------------- SORTING ----------------
    if (sort) {
      const [col, dir] = sort.split(',');
      const column = columnMap[col];

      if (column) {
        qb.orderBy(column, dir?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC');
      }
    } else {
      qb.orderBy('location.id', 'DESC');
    }


    qb.skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();

    return {
      content: data,
      size: take,
      pageIndex: page,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
      throw new InternalServerErrorException("There is an error");
    }

  }

}
