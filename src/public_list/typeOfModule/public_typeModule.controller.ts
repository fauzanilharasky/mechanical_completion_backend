import { Controller, Get, Query } from '@nestjs/common';
import { Public } from 'public.decorator';
import { TypeModuleService } from '../../master_typemodule/master_typemodule.services';

@Controller('public/master_type_module')
@Public()
export class PublicTypeModuleController {
  constructor(
    private readonly typeModuleService: TypeModuleService,
  ) {}


  @Get()
  async typeModuleList(@Query() query: any) {
    return this.typeModuleService.typeModuleList(query);
  }
}
