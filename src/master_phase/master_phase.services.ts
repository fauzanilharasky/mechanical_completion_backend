import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterPhase } from './master_phase.entity';
import { AesEcbService } from 'crypto/aes-ecb.service';

@Injectable()
export class MasterPhaseService {
  constructor(
    @InjectRepository(MasterPhase)
    private readonly phaseRepository: Repository<MasterPhase>,
     private readonly aesEcb: AesEcbService,
  ) {}

  async findAll(): Promise<MasterPhase[]> {
    return this.phaseRepository.find({
      relations: ['forms'], 
    });
  }

 
  async findOne(id: number): Promise<MasterPhase> {
    const phase = await this.phaseRepository.findOne({
      where: { id },
      relations: ['forms'],
    });

    if (!phase) {
      throw new NotFoundException(`Phase dengan ID ${id} tidak ditemukan`);
    }

    return phase;
  }

  // Create phase 
  async create(phase_name: string): Promise<MasterPhase> {
    const newPhase = this.phaseRepository.create({ phase_name });
    return this.phaseRepository.save(newPhase);
  }

  async update(id: number, phase_name: string): Promise<MasterPhase> {
    const phase = await this.findOne(id); 
    phase.phase_name = phase_name;
    return this.phaseRepository.save(phase);
  }

  async remove(id: number): Promise<void> {
    const result = await this.phaseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Phase dengan ID ${id} tidak ditemukan`);
    }
  }


  // ------------- PHASE LIST -----------------

  async phaseList(query: any) {
    const page = Number(query.page ?? 1);
    const size = Number(query.size ?? 10);
    const skip = (page - 1) * size;


    const qb = this.phaseRepository
    .createQueryBuilder("phase")
    .where('phase.status_delete = :status_delete', { status_delete: 1 });

     // UNTUK SEARCH PROJECT
    if (query.phase_code) {
    qb.andWhere(
      "phase.phase_code ILIKE :phase_code",
      { phase_code: `%${query.phase_code}%` }
    );
  }

  if (query.phase_name) {
    qb.andWhere(
      "phase.phase_name ILIKE :phase_name",
      { phase_name: `%${query.phase_name}%` }
    );
  }

  if (query.sort) {
    const [field, dir] = query.sort.split(",");
    qb.orderBy(`phase.${field}`, dir?.toUpperCase() === "DESC" ? "DESC" : "ASC");
  } else {
    qb.orderBy("phase.id", "DESC");
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




}
