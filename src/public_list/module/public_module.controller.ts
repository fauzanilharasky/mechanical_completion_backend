import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { MasterModuleService } from '../../master_module/master_module.services';
import { ServerSideDTO } from 'DTO/dto.serverside';

@Controller('public/master_module')
@Public()
export class PublicModuleController {
  constructor(
    private readonly masterModuleService: MasterModuleService,
  ) {}


  @Get()
  async moduleList(@Query() queryDto: ServerSideDTO) {
    return await this.masterModuleService.moduleList(queryDto);
  }
}
