import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { PortalProjectService } from 'portal_project/portal_project.service';

@Controller('public/portal_project')
@Public()
export class PublicProjectController {
  constructor(
    private readonly portalProjectService: PortalProjectService,
  ) {}


  @Get()
  async projectList(@Query() query: any) {
    return this.portalProjectService.projectList(query);
  }
}
