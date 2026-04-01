import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MasterSystem } from './master_system.entity';
import { ILike, In, Repository } from 'typeorm';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { PortalProject } from 'portal_project/portal_project.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { promises } from 'dns';

interface SystemListParams {
  page: number;
  size: number;
  sort?: string;
}


@Injectable()
export class MasterSystemService {
  save(ent: Promise<{ success: boolean; message: string; data: MasterSystem; }>): Promise<MasterSystem> {
    throw new Error('Method not implemented.');
  }
  repo: any;
  constructor(
    @InjectRepository(MasterSystem)
    private readonly masterRepo: Repository<MasterSystem>,
    @InjectRepository(PortalProject, "portal")
    private readonly _project: Repository<PortalProject>,
    private readonly aesEcb: AesEcbService,
  ) { }


  async getSystemDropdown() {
  return this.masterRepo.find({
    select: ['id', 'system_name'],
    where: { status_delete: 1 },
    order: { system_name: 'ASC' },
  });
}



  // master system List
     async findAll(query: any) {

      const page = Number(query.page ?? 1);
      const size = Number(query.size ?? 10);
      const skip = (page - 1) * size;

      const qb = this.masterRepo.createQueryBuilder("system");


      // ================= SEARCH =================
      if (query.system_name) {
        qb.andWhere(
          "CAST(system.system_name AS TEXT) ILIKE :system_name",
          { system_name: `%${query.system_name}%` }
        );
      }

      if (query.description) {
        qb.andWhere(
          "CAST(system.description AS TEXT) ILIKE :description",
          { description: `%${query.description}%` }
        );
      }
     

      // ================= SEARCH PROJECT (beda database) =================
    if (query.project_name) {

      const projects = await this._project.find({
        where: {
          project_name: ILike(`%${query.project_name}%`),
        },
        select: ["id"],
      });

      const projectIds = projects.map(p => p.id);

      if (projectIds.length === 0) {
        return {
          content: [],
          totalElements: 0,
          totalPages: 0,
        };
      }

      qb.andWhere("system.project_id IN (:...projectIds)", {
        projectIds,
      });
    }
      

        // ================= SORTING =================
    if (query.sort) {
      const [column, direction] = query.sort.split(",");
      qb.orderBy(`system.${column}`, direction.toUpperCase() === "DESC" ? "DESC" : "ASC");
    } else {
      qb.orderBy("system.id", "DESC");
    }

    // ================= PAGINATION =================
    qb.skip(skip).take(size);

    const [data, total] = await qb.getManyAndCount();

    // ================= PROJECT MAPPING =================
    const projectIds = [
      ...new Set(
        data
          .map((item) => item.project_id)
          .filter((id) => id && id !== 0)
      ),
    ];

    let projectMap = {};

    if (projectIds.length > 0) {
      const projects = await this._project.find({
        where: { id: In(projectIds) },
        select: ["id", "project_name"],
      });

      projectMap = projects.reduce((acc, p) => {
        acc[p.id] = p.project_name;
        return acc;
      }, {});
    }

    const result = data.map((item) => ({
      ...item,
      project_name: projectMap[item.project_id] ?? null,
    }));



      return {
        content: result,
        totalElements: total,
        totalPages: Math.ceil(total / size),
      };
  }
  


// FIND ONE MASTER SYSTEM

 async findOne(id: string) {
  const decId = Number(this.aesEcb.decryptBase64Url(id));
  const data = await this.masterRepo.findOne({
    where: { id: decId },
  });

  if (!data) return null;

  const project = await this._project.findOne({
    where: { id: data.project_id },
    select: ['id', 'project_name'],
  });

  return {
    ...data,
    project_name: project?.project_name || null,
  };
}




 async create(data: Partial<MasterSystem>, userId: number): Promise<MasterSystem> {
  const mastersystem = this.masterRepo.create({
    project_id: data.project_id,
    system_name: data.system_name,
    description: data.description,
    created_by: userId,
    // created_by: data.id_user,

  });

  return this.masterRepo.save(mastersystem);

  
}


  async update(id: string, data: Partial<MasterSystem>): Promise<MasterSystem> {
    const decId = Number(this.aesEcb.decryptBase64Url(id))

    await this.masterRepo.update(decId, {
      ...data,
      updated_by: Number(this.aesEcb.decryptBase64Url(data.updated_by.toString()))
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.masterRepo.delete(id);
  }



  

  // -------------- PUBLIC DATA LIST ----------------

  async systemList(query: any) {
  const page = Number(query.page ?? 1);
  const size = Number(query.size ?? 10);
  const skip = (page - 1) * size;

  const qb = this.masterRepo.createQueryBuilder("system");

  // ================= SEARCH =================
  if (query.system_name) {
    qb.andWhere(
      "CAST(system.system_name AS TEXT) ILIKE :system_name",
      { system_name: `%${query.system_name}%` }
    );
  }

  if (query.description) {
    qb.andWhere(
      "CAST(system.description AS TEXT) ILIKE :description",
      { description: `%${query.description}%` }
    );
  }

  // ================= SEARCH PROJECT (beda database) =================
if (query.project_name) {

  const projects = await this._project.find({
    where: {
      project_name: ILike(`%${query.project_name}%`),
    },
    select: ["id"],
  });

  const projectIds = projects.map(p => p.id);

  if (projectIds.length === 0) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
    };
  }

  qb.andWhere("system.project_id IN (:...projectIds)", {
    projectIds,
  });
}


  // ================= SORTING =================
  if (query.sort) {
    const [column, direction] = query.sort.split(",");
    qb.orderBy(`system.${column}`, direction.toUpperCase() === "DESC" ? "DESC" : "ASC");
  } else {
    qb.orderBy("system.id", "DESC");
  }

  // ================= PAGINATION =================
  qb.skip(skip).take(size);

  const [data, total] = await qb.getManyAndCount();

  // ================= PROJECT MAPPING =================
  const projectIds = [
    ...new Set(
      data
        .map((item) => item.project_id)
        .filter((id) => id && id !== 0)
    ),
  ];

  let projectMap = {};

  if (projectIds.length > 0) {
    const projects = await this._project.find({
      where: { id: In(projectIds) },
      select: ["id", "project_name"],
    });

    projectMap = projects.reduce((acc, p) => {
      acc[p.id] = p.project_name;
      return acc;
    }, {});
  }

  const result = data.map((item) => ({
    ...item,
    project_name: projectMap[item.project_id] ?? null,
  }));

  return {
    content: result,
    totalElements: total,
    totalPages: Math.ceil(total / size),
  };
}
}