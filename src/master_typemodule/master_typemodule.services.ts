import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";
import { MasterTypeModule } from "master_typemodule/master_typemodule.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AesEcbService } from "crypto/aes-ecb.service";

@Injectable()
export class TypeModuleService {
  serverSideList(queryDto: ServerSideDTO) {
    throw new Error("Method not implemented.");
  }
  constructor(
    @InjectRepository(MasterTypeModule)
    private readonly TypeModuleRepo: Repository<MasterTypeModule>,
    private readonly aesEcb: AesEcbService
  ) {}

  async findAll(queryDto: ServerSideDTO): Promise<MasterTypeModule[]> {
    return this.TypeModuleRepo.find();
  }

  async findOne(id: number): Promise<MasterTypeModule> {
    return this.TypeModuleRepo.findOne({ where: { id } });
  }

  async create(_data: Partial<MasterTypeModule>, name: string): Promise<MasterTypeModule> {
      const module = this.TypeModuleRepo.create({ name });
      return this.TypeModuleRepo.save(module);
    }

  // async create(
  //   data: Partial<MasterTypeModule>,
  //   name: string
  // ): Promise<MasterTypeModule> {
  //   const type_of_module = this.TypeModuleRepo.create({ name });
  //   return this.TypeModuleRepo.save(type_of_module);
  // }

    async update(id: number, name: string): Promise<MasterTypeModule> {
      await this.TypeModuleRepo.update(id, { name });
      return this.findOne(id);
    }

  async remove(id: number): Promise<void> {
    await this.TypeModuleRepo.delete(id);
  }


// ---------------- Data Public -------------------
   async typeModuleList(query: any) {
    const page = Number(query.page ?? 1);
    const size = Number(query.size ?? 10);
    const skip = (page - 1) * size;

    const qb = this.TypeModuleRepo
    .createQueryBuilder('type_module')
    .where('type_module.id IS NOT NULL');

    if (query.code) {
    qb.andWhere(
      "type_module.code ILIKE :code",
      { code: `%${query.code}%` }
    );
  }

  if (query.name) {
    qb.andWhere(
      "type_module.name ILIKE :name",
      { name: `%${query.name}%` }
    );
  }

  if (query.sort) {
    const [col, dir] = query.sort.split(',');
    qb.orderBy(`type_module.${col}`, dir?.toUpperCase() as 'ASC' | 'DESC');
  } else {
    qb.orderBy('type_module.id', 'DESC');
  }



    const [data, total] = await qb.skip(skip).take(size).getManyAndCount();

    return {
      content: data,
      pageIndex: page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }


  // fitup select Type Module
   async selectTypeModule() {
       const data = await this.TypeModuleRepo.find({
        where: { id: Not(0) },
        order: { name: "ASC" },
        select: ["id", "name"],
      });
  
      return {
        success: true,
        data,
      };
    }

}
