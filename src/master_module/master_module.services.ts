import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Not, Repository } from 'typeorm';
import { MasterModule } from './master_module.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { PortalProject } from 'portal_project/portal_project.entity';


@Injectable()
export class MasterModuleService {
  find(arg0: { select: string[]; }) {
    throw new Error('Method not implemented.');
  }
  serverSideList(_queryDto: ServerSideDTO) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(MasterModule)
    private readonly MasterModuleRepo: Repository<MasterModule>,

    @InjectRepository(PortalProject, "portal")
    private readonly _project: Repository<PortalProject>
  ) {}

  // 
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

      const [data, total] = await this.MasterModuleRepo.findAndCount({
        where: whereConditions,
        order: order,
        skip: skip,
        take: size ?? 10,
      });

        let arr_id_project = [];
        data.forEach((element) => {
          arr_id_project.push(element.project_id);
        });

        arr_id_project = [...new Set(arr_id_project)];
        const projects = await this._project.findBy({ id: In(arr_id_project) });
        const projectMap = projects.reduce((map, project) => {
          map[project.id] = project.project_name;
          return map;
        }, {} as Record<number, string>);

        const result = data.map((v) => ({
          ...v,
          project_name: projectMap[v.project_id] || "Not Set",
        }));

        console.log(result);

        // console.log(arr_id_project);

      return {
        content: result,
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



  async findOne(id: number): Promise<MasterModule> {
    return this.MasterModuleRepo.findOne({ where: { mod_id: id } });
  }

  async create(_data: Partial<MasterModule>, mod_desc: string): Promise<MasterModule> {
    const module = this.MasterModuleRepo.create({ mod_desc });
    return this.MasterModuleRepo.save(module);
  }

  async update(id: number, mod_desc: string): Promise<MasterModule> {
    await this.MasterModuleRepo.update(id, { mod_desc });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.MasterModuleRepo.delete(id);
  }

//    async dropdown(mod_id: number): Promise<void>{
//   return this.MasterModuleRepo.find({
//     where: { status: 1, status_delete: 0 },
//     order: { mod_desc: 'ASC' },
//   });
// }



 // PUBLIC DATA LIST  
async moduleList(query: any) {
  const page = Number(query.page ?? 1);
  const size = Number(query.size ?? 10);
  const skip = (page - 1) * size;

  const qb = this.MasterModuleRepo.createQueryBuilder("module");

  // SEARCH MODULE
  if (query.mod_desc) {
    qb.andWhere(
      "CAST(module.mod_desc AS TEXT) ILIKE :mod_desc",
      { mod_desc: `%${query.mod_desc}%` }
    );
  }

  // SEARCH PROJECT (beda database)
  if (query.project_name) {

    const projects = await this._project.find({
      where: {
        project_name: ILike(`%${query.project_name}%`),
      },
      select: ["id"],
    });

    const projectIds = projects.map(p => p.id);

    if (!projectIds.length) {
      return {
        content: [],
        totalElements: 0,
        totalPages: 0,
      };
    }

    qb.andWhere("module.project_id IN (:...projectIds)", {
      projectIds,
    });
  }

  // SORT
  if (query.sort) {
    const [column, direction] = query.sort.split(",");
    qb.orderBy(
      `module.${column}`,
      direction.toUpperCase() === "DESC" ? "DESC" : "ASC"
    );
  } else {
    qb.orderBy("module.mod_id", "DESC");
  }

  qb.skip(skip).take(size);

  const [data, total] = await qb.getManyAndCount();

  // PROJECT MAPPING
  const uniqueProjectIds = [
    ...new Set(data.map(item => item.project_id).filter(id => id > 0)),
  ];

  let projectMap = {};

  if (uniqueProjectIds.length) {
    const projects = await this._project.find({
      where: { id: In(uniqueProjectIds) },
      select: ["id", "project_name"],
    });

    projectMap = projects.reduce((acc, p) => {
      acc[p.id] = p.project_name;
      return acc;
    }, {});
  }

  const result = data.map(item => ({
    ...item,
    project_name: projectMap[item.project_id] ?? null,
  }));

  return {
    content: result,
    totalElements: total,
    totalPages: Math.ceil(total / size),
  };
}





  // async moduleList(queryDto: ServerSideDTO) {
  // try {
  //   const { sort, search, page, size } = queryDto;
    

  //   const whereConditions: any[] = [];
  //   const baseConditions: any = {
  //     status: 1, 
  //     project_id: Not(0),
  //   };

  //   const order: any = {};
  //    const skip: number = (page - 1) * size;

  //   if (sort) {
  //     const [field, direction] = sort.split(",");
  //     order[field] = direction?.toUpperCase() === "DESC" ? "DESC" : "ASC";
  //   }

  //   if (search) {
  //     whereConditions.push({
  //       ...baseConditions,
  //       mod_desc: ILike(`%${search}%`),
  //     });
  //   } else {
  //     whereConditions.push(baseConditions);
  //   }

  //   const [data, total] = await this.MasterModuleRepo.findAndCount({
  //     where: whereConditions,
  //     order: order,
  //     skip,
  //     take: size,
  //   });

  //   const arr_id_project = [...new Set(data.map(d => d.project_id))];

  //   const projects = await this._project.findBy({
  //     id: In(arr_id_project),
  //   });

  //   const projectMap = projects.reduce((map, project) => {
  //     map[project.id] = project.project_name;
  //     return map;
  //   }, {} as Record<number, string>);

  //   const result = data.map(v => ({
  //     ...v,
  //     project_name: projectMap[v.project_id] ?? "Not Set",
  //   }));

  //   return {
  //     content: result,
  //     total,
  //     pageIndex: page,
  //     size: size ?? 10,
  //     total_pages: Math.ceil(total / (size ?? 10)),
  //   };
  // } catch (error) {
  //   throw error;
  // }
// }



  // fitup select module

  async selectModule() {
         const data = await this.MasterModuleRepo.find({
          where: { mod_id: Not(0), status: 1, project_id: Not(0) },
          order: { mod_desc: "ASC" },
          select: ["mod_id", "mod_desc"],
        });
    
        return {
          success: true,
          data,
        };
      }

}

