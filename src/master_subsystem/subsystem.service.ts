import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Column } from 'typeorm';
import { Subsystem } from './subsystem.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { CreateSubsystemDTO } from './DTO/dto.subsystem';
import { MasterSystem } from 'master_system/master_system.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { Server } from 'http';

@Injectable()
export class SubsystemService {

  constructor(
    @InjectRepository(Subsystem)
    private readonly subsystemRepo: Repository<Subsystem>,
    @InjectRepository(MasterSystem)
    private readonly masterRepo: Repository<MasterSystem>,
     private readonly aesEcb: AesEcbService,
  ) {}


  // proccessing server side for subsystem list
  
  async findAll(queryDto: ServerSideDTO) {
    try {
      const { sort, page = 1, size = 10, ...query } = queryDto;
      const take = Number(size);
      const skip = (Number(page) - 1) * take;
      const qb = this.subsystemRepo
      .createQueryBuilder('subsystem')
      .leftJoinAndSelect('subsystem.system', 'system');

      const columnMap: Record<string, string> = {
        id: 'subsystem.id',
        system_name: 'system.system_name',
        subsystem_name: 'subsystem.subsystem_name',
        subsystem_description: 'subsystem.subsystem_description',
        status_delete: 'subsystem.status_delete',
      };

      Object.keys(query).forEach((key) => {
        if (!query[key]) return;

        const column = columnMap[key];
        if(!column) return;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, { [key]: `%${query[key]}%` });
      });

      // Sorting
        if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col];

        if (column) {
          qb.orderBy(column, dir?.toUpperCase() === "DESC" ? "DESC" : "ASC");
        }
      } else {
        qb.orderBy("subsystem.id", "DESC");
      }

      qb.skip(skip).take(take);
      const [data, total] = await qb.getManyAndCount();

      // map status ke string
      const mappedData = data.map((item) => ({
        ...item,
        status: item.status_delete === 1 ? 'Active' : 'Inactive',
      }));

      return {
        content: data,
        totalElements: total,
        pageIndex: page,
        size: take,
        totalPages: Math.ceil(total / size),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }



  /** Simple list untuk dropdown */
  async findAllSimple(): Promise<Subsystem[]> {
    return this.subsystemRepo.find({ relations: ['system'] });
  }

  // EDIT MASTER SUBSYSTEM
  async findOne(id: string): Promise<Subsystem> {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    const subsystem = await this.subsystemRepo.findOne({
      where: { id: decId },
      relations: ['system'],
    });
    if (!subsystem)
      throw new NotFoundException(`Subsystem with ID ${id} not found`);
    return subsystem;
  }


  // CREATE DATA
  async create(data: CreateSubsystemDTO, userId: number): Promise<Subsystem> {
    const systemExists = await this.subsystemRepo.manager.findOne(
      MasterSystem,
      { where: { id: data.system_id } },
    );
    if (!systemExists)
      throw new NotFoundException(
        `System with ID ${data.system_id} not found`,
      );

    const statusValue =
      data.status?.toLowerCase() === 'active'
        ? 1
        : data.status?.toLowerCase() === 'inactive'
        ? 0
        : 1;

    const subsystem = this.subsystemRepo.create({
      system: { id: data.system_id },
      subsystem_name: data.subsystem_name,
      subsystem_description: data.subsystem_description,
      status_delete: statusValue,
      created_by: userId,
      created_date: new Date(),
    });

    return this.subsystemRepo.save(subsystem);
  }

  async update(
    id: string,
    data: CreateSubsystemDTO,
    userId: number,
  ): Promise<Subsystem> {

    const decId = Number(this.aesEcb.decryptBase64Url(id))
    const subsystem = await this.subsystemRepo.findOne({
      where: { id: decId },
      relations: ['system'],
    });
    if (!subsystem)
      throw new NotFoundException(`Subsystem with ID ${id} not found`);

    subsystem.subsystem_name = data.subsystem_name;
    subsystem.subsystem_description = data.subsystem_description;

    // Update system jika ada
    if (data.system_id) {
      subsystem.system = { id: Number(data.system_id) } as any;
    }

    // Mapping status
    if (data.status) {
      subsystem.status_delete =
        data.status.trim().toLowerCase() === 'active' ? 1 : 0;
    }

    subsystem.updated_by = userId;
    subsystem.updated_date = new Date();

    return this.subsystemRepo.save(subsystem);
  }

  async remove(id: number): Promise<void> {
    const result = await this.subsystemRepo.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Subsystem with ID ${id} not found`);
  }





  // -------------- PUBLIC DATA LIST ----------------
    async subsystemList(queryDto: ServerSideDTO) {
    try {
    const { sort, page = 1, size = 10, ...query } = queryDto;
    const take = Number(size);
    const skip = (Number(page) - 1) * take;

    const qb = this.subsystemRepo.createQueryBuilder('subsystem')
      .leftJoinAndSelect('subsystem.system', 'system');

      const ColumnMap: Record<string, string> = {
      id: 'subsystem.id',
      system_name: 'system.system_name',
      subsystem_name: 'subsystem.subsystem_name',
      subsystem_description: 'subsystem.subsystem_description',
      status_delete: 'subsystem.status_delete',
      };

      Object.keys(query).forEach((key) => {
        if (!query[key]) return;

        const column = ColumnMap[key];
        if(!column) return;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, { [key]: `%${query[key]}%` });
      });

    // ================= SORTING =================
       if (sort) {
      const [col, dir] = sort.split(",");
      const column = ColumnMap[col];

      if (column) {
        qb.orderBy(column, dir?.toUpperCase() === "DESC" ? "DESC" : "ASC");
      }
    } else {
      qb.orderBy("subsystem.id", "DESC");
    }

    qb.skip(skip).take(take);
    /* ================= GET SUBSYSTEM ================= */
    const [data, total] = await qb.getManyAndCount();



    return {
      content: data,
      totalElements: total,
      pageIndex: page,
      size: take,
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

