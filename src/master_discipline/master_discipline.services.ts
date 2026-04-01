import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, IsNull } from 'typeorm';
import { MasterDiscipline } from './master_discipline.entity';

@Injectable()
export class MasterDisciplineService {
  constructor(
    @InjectRepository(MasterDiscipline)
    private readonly disciplineRepo: Repository<MasterDiscipline>,
  ) {}

  async findAll(): Promise<MasterDiscipline[]> {
    return this.disciplineRepo.find({
    });
  }

  async findOne(id: number): Promise<MasterDiscipline> {
    return this.disciplineRepo.findOne({ where: { id } });
  }

  async create(discipline_name: string): Promise<MasterDiscipline> {
    const discipline = this.disciplineRepo.create({ discipline_name });
    return this.disciplineRepo.save(discipline);
  }

  async update(id: number, discipline_name: string): Promise<MasterDiscipline> {
    await this.disciplineRepo.update(id, { discipline_name });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.disciplineRepo.delete(id);
  }

  // SELECT DISCIPLINE DATA TO EXPORT EXCEL
  async selectDiscipline() {
         const data = await this.disciplineRepo.find({
          where: { id: Not(0), status: 1, production_status: 1 },
          order: { discipline_name: "ASC" },
          select: ["id", "discipline_name"],
        });
    
        return {
          success: true,
          data,
        };
      }





  // ------------------ discipline Get data Public --------------------
  async disciplineList(query: any) {
  const page = Number(query.page ?? 1);
  const size = Number(query.size ?? 10);
  const skip = (page - 1) * size;

  const qb = this.disciplineRepo
    .createQueryBuilder("discipline")
    .where("discipline.status = :status", { status: 1 })
    .andWhere("discipline.warehouse_status = :warehouse_status", { warehouse_status: 1 });


  if (query.initial) {
    qb.andWhere(
      "discipline.initial ILIKE :initial",
      { initial: `%${query.initial}%` }
    );
  }

  if (query.discipline_name) {
    qb.andWhere(
      "discipline.discipline_name ILIKE :discipline_name",
      { discipline_name: `%${query.discipline_name}%` }
    );
  }

  // ================= SORTING =================
  if (query.sort) {
    const [field, dir] = query.sort.split(",");
    qb.orderBy(
      `discipline.${field}`,
      dir?.toUpperCase() === "DESC" ? "DESC" : "ASC"
    );
  } else {
    qb.orderBy("discipline.id", "DESC");
  }

 
  const [data, total] = await qb
    .skip(skip)
    .take(size)
    .getManyAndCount();

  return {
    content: data,
    total,
    pageIndex: page,
    size,
    totalPages: Math.ceil(total / size),
  };
}


}
