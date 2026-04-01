import { PortalProject } from 'portal_project/portal_project.entity';
import { MasterDiscipline } from 'master_discipline/master_discipline.entity';
import { Subsystem } from '../master_subsystem/subsystem.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  RelationId,
} from "typeorm";
import { MasterTypeModule } from 'master_typemodule/master_typemodule.entity';
import { MasterModule } from 'master_module/master_module.entity';
import { PcmsITR } from 'pcms_itr/pcms_itr.entity';
import { MasterSystem } from 'master_system/master_system.entity';
import { MasterForm } from 'master_form/master_form.entity';

@Entity({ name: "pcms_mc_template" })
export class PcmsMcTemplate {
  id_template: any;
  production_assigned_to: any;
  report_number: any;
  date_request: Date;
  status_inspection: any;
  report_no: string;
  project_name: string;
  company: any;
  assigned_to_name: string;
  itr: any;
  userMap: any;

  static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint", nullable: true })
  project_id: number;


  @Column({ type: "bigint", nullable: true })
  discipline: number;

  @Column({ type: "bigint", nullable: true })
  module: number;

  @Column({ type: "bigint", nullable: true })
  type_of_module: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  drawing_no: string;

  @Column({ type: "bigint", nullable: true })
  cert_id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  event_id: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  tag_number: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  tag_description: string;

  @Column({ type: "bigint", nullable: true })
  system: number;

  @Column({ type: "bigint", nullable: true })
  subsystem: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  subsystem_description: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  phase: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  location: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  model_no: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  serial_no: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  rating: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  remarks: string;


  @Column({ type: "bigint", nullable: true })
  status_delete: number;

  @Column({ type: "bigint", nullable: true })
  status: number;

  @Column({ type: "bigint", nullable: true })
  workpack_id: number;

  @Column({ type: "bigint", nullable: true })
  created_by: number;

  @CreateDateColumn({ type: "timestamp" })
  created_date: Date;

  @Column({ type: "bigint", nullable: true })
  updated_by: number;

  @UpdateDateColumn({ type: "timestamp" })
  updated_date: Date;

  @Column({ type: "bigint", nullable: true })
  deleted_by: number;

  @DeleteDateColumn({ type: "timestamp" })
  deleted_date: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  manufacturer: string;


  @Column({ type: "bigint", nullable: true })
  company_id: number;

  // production_user_by
  
  @Column({ type: "bigint", nullable: true })
  assignment_status: number;


  // Realtions many to one
  @ManyToOne(() => MasterDiscipline, (discipline) => discipline.id)
  @JoinColumn({ name: "discipline" })
  discipline_tag: MasterDiscipline;

  
  @ManyToOne(() => Subsystem, (Subsystem) => Subsystem.id)
  @JoinColumn({ name: "subsystem" }) 
  subsystem_rel: Subsystem;

  
  @ManyToOne(() => MasterForm, (masterform) => masterform.templates)
  @JoinColumn({ name: "cert_id" })
  cert_rel: MasterForm;

  // ------------- Portal Project --------------
  //  @ManyToOne(() => PortalProject, (portalProject) => portalProject.id)
  // @JoinColumn({ name: "project_id" })
  // project_rel: PortalProject;


  @ManyToOne(() => MasterSystem, (masterSystem) => masterSystem.id)
  @JoinColumn({ name: "system" }) 
  system_rel: MasterSystem;

  @ManyToOne(() => MasterTypeModule, (typemodule) => typemodule.id)
  @JoinColumn({ name: "type_of_module" })
  typeModule: MasterTypeModule;

   @ManyToOne(() => MasterModule, (mastermodule) => mastermodule.mod_id)
  @JoinColumn({ name: "module" })
  templates_md: MasterModule;

  // One to Many
  @OneToMany(() => PcmsITR, (itr) => itr.template)
  pcms_itr: PcmsITR[];


 
}