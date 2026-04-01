import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  Query,
  Req,
} from "@nestjs/common";
import { MasterTypeModule } from "./master_typemodule.entity";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ServerSideDTO } from "DTO/dto.serverside";
import { TypeModuleService } from "./master_typemodule.services";

@Controller("api/master_type_module")
@ApiBearerAuth("access-token")
export class MasterTypeModuleController {
  constructor(private readonly typeModuleService: TypeModuleService) {}

  @Get("select")
   async select() {
     return this.typeModuleService.selectTypeModule();
   }

  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return await this.typeModuleService.findAll(queryDto);
  }

  @Get(":id")
  findOne(@Param("id") id: number): Promise<MasterTypeModule> {
    return this.typeModuleService.findOne(id);
  }

  @Post("/create")
  async create(
    @Body() data: Partial<MasterTypeModule>,
    @Req() req
  ): Promise<MasterTypeModule> {
    return this.typeModuleService.create(data, req.user.userId);
  }

  @Put(":id")
  update(
    @Param("id") id: number, @Body() data: Partial<MasterTypeModule>): Promise<MasterTypeModule> {
    return this.typeModuleService.update( id, data.name );
  }

  @Delete(":id")
  remove(@Param("id") id: number): Promise<void> {
    return this.typeModuleService.remove(id);
  }

  //mendapatakan data seluruh land location secara server side
  @Post("/serverside_list")
  async serverSideList(@Query() queryDto: ServerSideDTO) {
    const data = await this.typeModuleService.serverSideList(queryDto);
    return data;
  }




}
