import { Controller, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { MasterPhaseService } from './master_phase.services';
import { MasterPhase } from './master_phase.entity';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('api/master_phase')
@ApiBearerAuth('access-token')
export class MasterPhaseController {
  constructor(private readonly phaseService: MasterPhaseService) {}

  @Get()
  findAll(): Promise<MasterPhase[]> {
    return this.phaseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<MasterPhase> {
    return this.phaseService.findOne(id);
  }   

  @Post()
  create(@Body('phase_name') phase_name: string): Promise<MasterPhase> {
    return this.phaseService.create(phase_name);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body('phase_name') phase_name: string,
  ): Promise<MasterPhase> {
    return this.phaseService.update(id, phase_name);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.phaseService.remove(id);
  }
}
