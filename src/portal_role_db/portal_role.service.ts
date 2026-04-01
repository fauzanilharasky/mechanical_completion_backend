import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { portalRoleDB } from './portal_role.entity';
import { Repository } from 'typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { ServerSideDTO } from 'DTO/dto.serverside';

@Injectable()
export class PortalRoleDBService {
    constructor(
        @InjectRepository(portalRoleDB, 'portal')
        private readonly _portalRoleDB: Repository<portalRoleDB>, 
        private readonly aesEcb: AesEcbService,
    
    ) { }
async findAll(query: any) {

  const qb = this._portalRoleDB.createQueryBuilder("roleDB");

  if (query.sort) {
    const [column, direction] = query.sort.split(",");
    qb.orderBy(
      `roleDB.${column}`,
      direction.toUpperCase() === "DESC" ? "DESC" : "ASC"
    );
  } else {
    qb.orderBy("roleDB.id_role", "DESC");
  }

  // ⬇️ Hanya pakai pagination kalau ada page param
  if (query.page && query.size) {
    const page = Number(query.page);
    const size = Number(query.size);
    const skip = (page - 1) * size;

    qb.skip(skip).take(size);

    const [data, total] = await qb.getManyAndCount();

    return {
      content: data,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }

  // ⬇️ Kalau tidak ada pagination → ambil semua
  const data = await qb.getMany();

  return data;
}

}