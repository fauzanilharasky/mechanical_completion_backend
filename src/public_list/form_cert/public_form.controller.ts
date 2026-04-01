import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { MasterModuleService } from '../../master_module/master_module.services';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { MasterFormService } from 'master_form/master_form.services';


@Controller('public/master_form')
@Public()
export class PublicFormController {
  constructor(
    private readonly masterFormService: MasterFormService,
  ) {}


  @Get()
  async certList(@Query() queryDto: ServerSideDTO) {
    return await this.masterFormService.certList(queryDto);
  }
}
