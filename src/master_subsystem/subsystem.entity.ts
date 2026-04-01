import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MasterSystem } from '../master_system/entities/master_system.entity'; 
import { PcmsMcTemplate } from 'pcms_mc_template/pcms_template.entity';

// @Entity({ name: 'master_subsystem', schema: 'public' }) 


@Entity({ name: 'master_subsystem', schema: 'public' }) 
export class Subsystem {
  @PrimaryGeneratedColumn({ type: 'int' })   
  id: number;

  @Column({ type: 'varchar', length: 255 })  
  subsystem_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true }) 
  subsystem_description: string;

  @Column({ type: 'int', default: 1 })
  status_delete: number;
  
   @Column({ type: 'int', default: 1 })
  system_id: number;

  get status(): string {
  return this.status_delete === 0 ? 'Active' : 'Inactive';
  }

  @Column({ type: 'int', nullable: true })  
  created_by: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }) 
  created_date: Date;

  @Column({ type: 'int', nullable: true })   
  updated_by: number;

  @UpdateDateColumn({ type: 'timestamp', nullable: true }) 
  updated_date: Date;

  @Column({ type: 'int', nullable: true })  
  deleted_by: number;

  @Column({ type: 'timestamp', nullable: true }) 
  deleted_date: Date;


  // relasi
  @OneToMany(() => PcmsMcTemplate, (subsystem_rel) => subsystem_rel.subsystem)
  subsystem_rel: PcmsMcTemplate[];

    
  @ManyToOne(() => MasterSystem, (system: MasterSystem) => system.subsystems)
  @JoinColumn({ name: 'system_id' })
  system: MasterSystem;
}

