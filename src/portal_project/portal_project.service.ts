import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PortalProject } from './portal_project.entity';
import { promises } from 'dns';

interface ProjectListParams {
  page: number;
  size: number;
  sort?: string;
}

@Injectable()
export class PortalProjectService {
  constructor(
    @InjectRepository(PortalProject, 'portal')
    private repo: Repository<PortalProject>,
  ) {}

  async findAll(): Promise<PortalProject[]> {
    return this.repo.find(); 
  }



  async getProjects() {
    return this.repo.find();
  }

// ----------- fitup project select ----------
 async selectProject() {
  const data = await this.repo
    .createQueryBuilder("project")
    .select(["project.id", "project.project_name", "project.status"])
    .where("project.id != :id", { id: 0 })
    .andWhere("project.status = :status", { status: 1 })
    .orderBy("project.project_name", "ASC")
    .getMany();

  return {
    success: true,
    data,
  };
}



  async getProject(params: ProjectListParams) {
    const { page, size, sort } = params;

    // frontend kirim page mulai dari 1
    const take = size;
    const skip = (page - 1) * take;

    let orderBy = 'project.id';
    let orderDir: 'ASC' | 'DESC' = 'DESC';

    // parsing sort: "project_code,desc"
    if (sort) {
      const [field, direction] = sort.split(',');
      orderBy = `project.${field}`;
      orderDir = direction?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    }

    const qb = this.repo.createQueryBuilder('project');

    const totalElements = await qb.getCount();

    const content = await qb
      .orderBy(orderBy, orderDir)
      .skip(skip)
      .take(take)
      .getMany();

    return {
      content,
      page,
      size,
      totalElements,
      totalPages: Math.ceil(totalElements / size),
    };
  }


  // -------------------- PUBLIC DATA ----------------------

   async projectList(query: any) {
    const page = Number(query.page ?? 1);
    const size = Number(query.size ?? 10);
    const skip = (page - 1) * size;

    const qb = this.repo
    .createQueryBuilder('project')
    .where('project.status = :status', { status: 1 });

    // UNTUK SEARCH PROJECT
    if (query.project_code) {
    qb.andWhere(
      "project.project_code ILIKE :project_code",
      { project_code: `%${query.project_code}%` }
    );
  }

  if (query.project_name) {
    qb.andWhere(
      "project.project_name ILIKE :project_name",
      { project_name: `%${query.project_name}%` }
    );
  }

    // ================= SORTING =================
    if (query.sort) {
    const [field, dir] = query.sort.split(",");
    qb.orderBy(
      `project.${field}`,
      dir?.toUpperCase() === "DESC" ? "DESC" : "ASC"
    );
  } else {
    qb.orderBy("project.id", "DESC");
  }



    const [data, total] = await qb.skip(skip).take(size).getManyAndCount();

    return {
      content: data,
      totalElements: total,
      pageIndex: page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

// CREATE PROJECT
  async createProject(payload: any) {
  return {
    success: true,
    message: 'Successfully to Create Data',
    data: payload,
  };
}

} 