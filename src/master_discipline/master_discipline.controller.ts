import { Controller, Get, Post, Param, Body, Put, Delete, Query } from '@nestjs/common';
import { MasterDisciplineService } from './master_discipline.services';
import { MasterDiscipline } from './master_discipline.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('api/master_discipline')
@ApiBearerAuth('access-token')
export class MasterDisciplineController {
  constructor(private readonly disciplineService: MasterDisciplineService) {}
  
  @Get('dropdown')
async disciplineList(@Query() query: any) {
  return this.disciplineService.disciplineList(query);
}

@Get("select")
 async select() {
   return this.disciplineService.selectDiscipline();
 }
 
  @Get()
  findAll(): Promise<MasterDiscipline[]> {
    return this.disciplineService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<MasterDiscipline> {
    return this.disciplineService.findOne(id);
  }

  @Post()
  create(@Body('discipline_name') discipline_name: string): Promise<MasterDiscipline> {
    return this.disciplineService.create(discipline_name);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body('discipline_name') discipline_name: string,
  ): Promise<MasterDiscipline> {
    return this.disciplineService.update(id, discipline_name);
  }


  


  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.disciplineService.remove(id);
  }
}
