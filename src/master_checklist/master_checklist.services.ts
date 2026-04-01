import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MasterChecklist } from '../master_checklist/master_checklist.entity';
import { ILike, Repository, Raw } from 'typeorm';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { MasterForm } from 'master_form/master_form.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';


@Injectable()
export class MasterChecklistService {
  [x: string]: any;
  constructor(
    @InjectRepository(MasterChecklist)
    private readonly masterChecklistRepo: Repository<MasterChecklist>,

    @InjectRepository(MasterForm)
    private readonly masterFormRepo: Repository<MasterForm>,
    private readonly aesEcb: AesEcbService,
  ) { }



  async findAll(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page, size } = queryDto;


      const whereConditions: any[] = [];
      const baseConditions: any = {};
      const order: any = {};
      const skip: number = ((page ?? 1) - 1) * (size ?? 10);

      if (sort) {
        var orderBy = sort.split(",");
        order[orderBy[0]] = orderBy[1];
      }

      if (search) {
        whereConditions.push({
          ...baseConditions,
          remarks: ILike(`%${search}%`),
        })
      } else {
        whereConditions.push(baseConditions);
      }


      const [data, total] = await this.masterChecklistRepo.findAndCount({
        where: whereConditions,
        order: order,
        skip: skip,
        take: size ?? 10,
      });

      return {
        content: data,
        total: total,
        pageIndex: page,
        totalPages: 100,
        size: size ?? 10,
        total_pages: Math.ceil(total / (size ?? 10)),
      }

    } catch (error) {
      throw new Error(error);
    }
  }

  // Edit master Checklist
  findOne(id: string): Promise<MasterChecklist> {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    return this.masterChecklistRepo.findOne({ where: { id: decId } });
  }

  // create
  async create(data: Partial<MasterChecklist>, idUser: number): Promise<MasterChecklist> {
  try {
      const dec_form_id = Number(this.aesEcb.decryptBase64Url(String(data.form_id)));

    if (!data.form_id) {
      throw new BadRequestException('form_id is required');
    }

    const masterForm = await this.masterFormRepo.findOne({
      where: { id: dec_form_id },
    });

    if (!masterForm) {
      throw new BadRequestException('Master Form not found');
    }

    const checklist = this.masterChecklistRepo.create({
      ...data,
      form: masterForm,
      created_by: idUser,
    });

    return await this.masterChecklistRepo.save(checklist);
  } catch (error) {
    throw new InternalServerErrorException(error.message);
  }
}


// update
async update(id: string, data: Partial<MasterChecklist>): Promise<MasterChecklist> {
  let { updated_by, status_delete, form_id, ...rest } = data;

   const decId = Number(this.aesEcb.decryptBase64Url(id))

  if (updated_by) {
    try {
      const decrypted = this.aesEcb.decryptBase64Url(String(updated_by));
      updated_by = Number(decrypted);
    } catch (err) {
      console.error("Decrypt failed for updated:", updated_by);
      updated_by = null;
    }
  }

  // pastikan status_delete tetap number
  if (status_delete !== undefined) {
    status_delete = Number(status_delete);
  }

  await this.masterChecklistRepo.update(decId, {
    ...rest,
    ...(status_delete !== undefined ? { status_delete } : {}),
    ...(updated_by ? { updated_by } : {}),
  });

  return this.findOne(id);
}



// ------------------ EXPORT TO EXCEL ----------------

async exportList(query: { search?: string; sort?: string }) {
  const qb = this.masterChecklistRepo.createQueryBuilder("m");

  const columnMap = {
    item_no: "m.item_no",
    group_name: "m.group_name",
    description: "m.description",
    status_delete: "m.status_delete",
  };

  // 🔹 SEARCH
  if (query.search) {
    const searchObj = JSON.parse(query.search);
    Object.keys(searchObj).forEach((key) => {
      qb.andWhere(`CAST(${columnMap[key]} AS TEXT) ILIKE :${key}`, {
        [key]: `%${searchObj[key]}%`,
      });
    });
  }

  if (query.sort) {
    const [col, dir] = query.sort.split(",");

    if (col === "item_no") {
      qb.orderBy(
        "CAST(REPLACE(m.item_no, ',', '.') AS NUMERIC)",
        dir.toUpperCase() as "ASC" | "DESC"
      );
    } else {
      qb.orderBy(
        columnMap[col],
        dir.toUpperCase() as "ASC" | "DESC"
      );
    }
  }

  const data = await qb.getMany();

  return data.map((d, i) => ({
    NO: i + 1,
    ITEM_NO: d.item_no,
    GROUP_NAME: d.group_name,
    DESCRIPTION: d.description,
    STATUS: d.status_delete === 1 ? "Active" : "Inactive",
  }));
}




  async remove(id: number): Promise<void> {
    await this.masterChecklistRepo.delete(id);
  }



  // search
 async serverSideList(queryDto: ServerSideDTO) {
  try {
    const { sort, search, page = 1, size = 10, form_id } = queryDto;

    const take = size;
    const skip = (page - 1) * take; // ✅ FIXED

    const dec_form_id = Number(this.aesEcb.decryptBase64Url(form_id))

    const qb = this.masterChecklistRepo
      .createQueryBuilder("masterchecklist")
      .leftJoinAndSelect("masterchecklist.form", "form");

    if (dec_form_id) {
      qb.andWhere("masterchecklist.form_id = :form_id", { form_id: dec_form_id });
    }

    const columnMap: Record<string, string> = {
      item_no: "masterchecklist.item_no",
      description: "masterchecklist.description",
      group_name: "masterchecklist.group_name",
      status_delete: "masterchecklist.status_delete",
    };

    // SORTING
    if (sort) {
      const [col, dir] = sort.split(",");
      const orderColumn = columnMap[col] ?? `masterchecklist.${col}`;

      qb.orderBy(orderColumn, dir.toUpperCase() as "ASC" | "DESC");
    }

    // SEARCHING
    if (search) {
      const searchVar = JSON.parse(search);
      Object.keys(searchVar).forEach((key) => {
        const column = columnMap[key];
        if (!column) return;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${searchVar[key]}%`,
        });
      });
    }

    const [data, total] = await qb
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data,                 // ✅ kosong jika tidak ada checklist
      total,
      page,
      limit: take,
      total_pages: Math.ceil(total / take),
    };
  } catch (error) {
    throw new InternalServerErrorException(error.message);
  }
}

}
