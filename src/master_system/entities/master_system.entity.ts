import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Subsystem } from '../../master_subsystem/subsystem.entity';

@Entity({ name: 'master_system' , schema: 'public' })
export class MasterSystem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  project_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  system_name: string;

  // Relasi OneToMany ke Subsystem
  @OneToMany(() => Subsystem, (subsystem: Subsystem) => subsystem.system)
  subsystems: Subsystem[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'bigint', nullable: true })
  created_by: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_date: Date;

  @Column({ type: 'bigint', nullable: true })
  updated_by: number;

  @UpdateDateColumn({ type: 'timestamp', nullable: true, onUpdate: 'CURRENT_TIMESTAMP' })
  updated_date: Date;

  @Column({ type: 'bigint', nullable: true })
  deleted_by: number;

  @Column({ type: 'timestamp', nullable: true })
  deleted_date: Date;

  @Column({ type: 'int', default: 0 })
  status_delete: number;
}


