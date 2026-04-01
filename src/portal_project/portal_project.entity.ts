import { MasterSystem } from 'master_system/master_system.entity';
import { PcmsMcTemplate } from 'pcms_mc_template/pcms_template.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('portal_project')
export class PortalProject {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_code', type: 'varchar', length: 50 })
  project_code: string;

  @Column({ name: 'project_name', type: 'varchar', length: 255 })
  project_name: string;

  @Column({ name: 'project_logo', type: 'text', nullable: true })
  projectLogo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  client: string | null;

  @Column({ type: "bigint", nullable: true })
  status: number;

  @Column({ name: 'client_logo', type: 'text', nullable: true })
  clientLogo: string | null;
  mod_id: any;

}
