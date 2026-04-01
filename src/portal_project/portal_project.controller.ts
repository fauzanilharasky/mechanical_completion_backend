import { Controller, Get, Post, Param, Body, Put, Delete, Query } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PortalProjectService } from './portal_project.service';
import { PortalProject } from './portal_project.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';

@Controller('api/project')
@ApiBearerAuth('access-token')
export class ProjectController {
  constructor(
    private readonly projectService: PortalProjectService,
    private readonly aesEcb: AesEcbService
  ) {}

   @Get("select")
   async select() {
     return this.projectService.selectProject();
   }

  @Get()
  async getAll(): Promise<PortalProject[]> {
    return this.projectService.findAll();
  }


  @Get('/project_list')
  async getProjects() {
    return this.projectService.getProjects();
  }


  @Get('')
  async getProjectData(
    @Query('page') page = 1,
    @Query('size') size = 10,
    @Query('sort') sort?: string,
  ) {
    return this.projectService.getProject({
      page: Number(page),
      size: Number(size),
      sort,
    });
  }


  @Post('/create')
  async createProject(@Body() body: any) {
  return this.projectService.createProject(body);
}

}