import { MasterDiscipline } from "./../master_discipline/master_discipline.entity";
import { MasterPhase } from "./../master_phase/master_phase.entity";
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MasterForm } from "../master_form/master_form.entity";
import { ILike, Repository } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AesEcbService } from "crypto/aes-ecb.service";

@Injectable()
export class MasterFormService {
  constructor(
    @InjectRepository(MasterForm)
    private readonly masterFormRepo: Repository<MasterForm>,
    @InjectRepository(MasterPhase)
    private readonly MasterPhaseRepo: Repository<MasterPhase>,
    @InjectRepository(MasterDiscipline)
    private readonly MasterDisciplineRepo: Repository<MasterDiscipline>,
    private readonly aesEcb: AesEcbService
  ) {}


// PUBLIC DATA CERT_ID
async certList(queryDto: ServerSideDTO) {
  try {
    const { sort, page = 1, size = 10, ...filters } = queryDto;

    const take = Number(size);
    const skip = (Number(page) - 1) * take;

    const qb = this.masterFormRepo
      .createQueryBuilder("masterform")
      .leftJoinAndSelect("masterform.discipline_rel", "discipline")
      .leftJoinAndSelect("masterform.phase", "phase");

    // ---------------- SEARCH / FILTER ----------------
    const columnMap: Record<string, string> = {
      cert_id: "masterform.cert_id",
      form_code: "masterform.form_code",
      activity_description: "masterform.activity_description",
      discipline: "discipline.discipline_name",
      phase: "phase.phase_name",
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
      const [col, dir] = sort.split(",");
      const column = columnMap[col];

      if (column) {
        qb.orderBy(column, dir?.toUpperCase() === "DESC" ? "DESC" : "ASC");
      }
    } else {
      qb.orderBy("masterform.id", "DESC");
    }

    // ---------------- PAGINATION ----------------
    qb.skip(skip).take(take);

    const [data, total] = await qb.getManyAndCount();

    return {
      content: data,
      total,
      page: Number(page),
      size: take,
      total_pages: Math.ceil(total / take),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new InternalServerErrorException(error.message);
    }
    throw new InternalServerErrorException("There is an error");
  }
}




  async findAll(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 1, size = 10 } = queryDto;

      const whereConditions: any[] = [];
      const baseConditions: any = {};
      const order: any = {};
      const skip: number = (page - 1) * size;

      const { form_code, phase_name, discipline, activity_description } =
        search ? JSON.parse(search) : {};

      if (sort) {
        const [col, dir] = sort.split(",");
        order[col] = dir.toUpperCase();
      }

      if (search) {
        whereConditions.push({
          ...baseConditions,
          remarks: ILike(`%${search}%`),
        });
      } else {
        whereConditions.push(baseConditions);
      }

      const where: any = {};
      if (form_code) where.form_code = ILike(`%${form_code}%`);
      if (phase_name) where.phase = { phase_name: ILike(`%${phase_name}%`) };
      if (discipline)
        where.discipline_rel = {
          discipline_name: ILike(`%${discipline}%`),
        };
      if (activity_description)
        where.activity_description = ILike(`%${activity_description}%`);

      const [data, total] = await this.masterFormRepo.findAndCount({
        where: whereConditions,
        order: order,
        skip,
        take: size,
        relations: ["phase", "discipline_rel"],
      });

      return {
        content: data,
        total,
        pageIndex: page,
        size,
        total_pages: Math.ceil(total / size),
      };
    } catch (error) {  if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }

  async findOne(id: string): Promise<MasterForm> {
  const decId = Number(this.aesEcb.decryptBase64Url(id));

  const data = await this.masterFormRepo.findOne({
    where: { id: decId },
    relations: ['phase', 'discipline_rel'],
  });

  if (!data) {
    throw new NotFoundException('MasterForm Undefined');
  }

  return data;
}


  
  async create(data: Partial<MasterForm>): Promise<MasterForm> {
    try {
      
      const decrypted = this.aesEcb.decryptBase64Url(String(data.created_by));
      const userId = parseInt(decrypted, 10);

      if (isNaN(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

     
      const dataForm = { ...data, created_by: userId };

     
      const form = this.masterFormRepo.create(dataForm);
      return await this.masterFormRepo.save(form);

    }catch (error) {  if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }


  // UPDATE 

  async update(id: string, data: Partial<MasterForm>): Promise<MasterForm> {
    let { updated_by, options, phase_id, discipline, ...restData } = data;
     const decId = Number(this.aesEcb.decryptBase64Url(id))

    if ("phase_name" in restData) {
      delete (restData as any).phase_name;
    }

    if (updated_by) {
      updated_by = Number(this.aesEcb.decryptBase64Url(String(updated_by)));
    }

    let optionsValue = options;
    if (Array.isArray(options)) {
      optionsValue = options.join(", ");
    }
    if (typeof optionsValue === "string") {
      optionsValue = optionsValue.replace(/[{}"]/g, "");
    }

    const oldData = await this.masterFormRepo.findOne({ where: { id:decId } });

    const newData: any = {
      ...oldData,
      ...restData,
      updated_by,
      options: optionsValue,
    };

    if (phase_id) {
      const phaseEntity = await this.MasterPhaseRepo.findOne({
        where: { id: Number(phase_id) },
      });
      newData.phase = phaseEntity;
    }

    if (discipline) {
      const disciplineEntity = await this.MasterDisciplineRepo.findOne({
        where: { id: Number(discipline) },
      });
      newData.discipline_rel = disciplineEntity;
    }

    await this.masterFormRepo.save(newData);
    return this.findOne(id);
  }


  // REMOVE
  async remove(id: number): Promise<void> {
    await this.masterFormRepo.delete(id);
  }
  
  // serverside List
  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 1, size = 10 } = queryDto;
      const take = size;
      const skip = (page - 1) * take;

      const qb = this.masterFormRepo
        .createQueryBuilder("masterform")
        .leftJoinAndSelect("masterform.discipline_rel", "discipline")
        .leftJoinAndSelect("masterform.phase", "phase");

      const columnMap: Record<string, string> = {
        cert_id: "masterform.cert_id",
        form_code: "masterform.form_code",
        activity_description: "masterform.activity_description",
        inspection_type: "masterform.inspection_type",
        options: "masterform.options",
        phase_name: "phase.phase_name",
        discipline: "discipline.discipline_name",
      };

      if (sort) {
        const [col, dir] = sort.split(",");
        if (col === "phase_name") {
          qb.orderBy("phase.phase_name", dir.toUpperCase() as "ASC" | "DESC");
        } else if (col === "discipline_name") {
          qb.orderBy(
            "discipline.discipline_name",
            dir.toUpperCase() as "ASC" | "DESC"
          );
        } else if (columnMap[col]) {
          qb.orderBy(columnMap[col], dir.toUpperCase() as "ASC" | "DESC");
        }
      }

      if (search) {
        const search_var = JSON.parse(search);
        Object.keys(search_var).forEach((key) => {
          const column = columnMap[key];
          if (!column) throw new Error(`Invalid search column: ${key}`);

          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${search_var[key]}%`,
          });
        });
      }

      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

      return {
        data,
        total,
        page,
        limit: size,
        total_pages: Math.ceil(total / size),
      };
    } catch (error) {  if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }
}