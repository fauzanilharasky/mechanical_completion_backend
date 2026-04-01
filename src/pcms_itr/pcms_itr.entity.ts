import { MasterDiscipline } from 'master_discipline/master_discipline.entity';
import { PcmsItrChecklist } from 'pcms_itr_checklist/pcms_checklist.entity';
import { PcmsMcTemplate } from 'pcms_mc_template/pcms_template.entity';
import { PortalUser } from 'portal_user_db/portal_user.entity';
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
} from "typeorm";



@Entity({ name: "pcms_itr" })
export class PcmsITR {
  id: any;
  project_id: any;
  pcms_template: any;

  static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn()
  id_itr: number;

  @Column({ type: "varchar", length: 255, nullable: true})
  report_number: string;

 @Column({ type: "varchar", length: 255, nullable: true })
  submission_id: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  rejected_remarks: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  pending_qc_remarks: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  rejected_client_remarks: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  submission_remarks: string;

   @Column({ type: "varchar", length: 255, nullable: true })
  inspection_remarks: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  location_inspect: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  document_approval_by: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  inspector_id: string;

   @Column({ type: "varchar", length: 255, nullable: true })
  company_id: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  time_inspect: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  legend_inspection_auth: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  report_no_rev: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  drawing_rev_no: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ga_rev_no: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  as_rev_no: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  sp_rev_no: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  latest_update_by: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  remarks: string;


//   integer

@Column({ type: "bigint", nullable: true })
  resubmit_from_id: number;

 @Column({ type: "bigint", nullable: true })
  requestor: number;

  @Column({ type: "bigint", nullable: true })
  id_template: number;

  @Column({ type: "bigint", nullable: true })
  transmittal_by: number;

 @Column({ type: "bigint", nullable: true })
  status_inspection: number;

  @Column({ type: "bigint", nullable: true })
  inspection_by: number;

  @Column({ type: "bigint", nullable: true })
  status_revise_history: number;

  @Column({ type: "bigint", nullable: true })
  status_delete: number;

  @Column({ type: "bigint", nullable: true })
  inspection_client_by: number;

  @Column({ type: "bigint", nullable: true })
  device_status: number;

  @Column({ type: "bigint", nullable: true })
  requested_for_update: number;

  @Column({ type: "bigint", nullable: true })
  id_workpack: number;

  @Column({ type: "bigint", nullable: true })
  area_v2: number;

  @Column({ type: "bigint", nullable: true })
  location_v2: number;

  @Column({ type: "bigint", nullable: true })
  point_v2: number;

   @Column({ type: "bigint", nullable: true })
  spv_inspection_by: number;

//   timestamp
  @Column({ type: "timestamp" })
  date_request: Date;

  @CreateDateColumn({ type: "timestamp" })
  inspection_datetime: number;

  @CreateDateColumn({ type: "timestamp" })
  transmittal_datetime: number;


  // production Assignment
   @Column({ type: "bigint", nullable: true })
  production_assigned_to: number;

  @CreateDateColumn({ type: "timestamp" })
  production_assigned_date: Date;

   @Column({ type: "bigint", nullable: true })
  production_assigned_by: number;
  
  @CreateDateColumn({ type: "timestamp" })
  production_date_signed: Date;

   @CreateDateColumn({ type: "timestamp" })
  spv_inspection_datetime: Date;


// 

  @Column({ type: "bigint", nullable: true })
  status_invitation: number;

  // @Column({ type: "bigint", nullable: true })
  // workpackid: number;

  @CreateDateColumn({ type: "timestamp" })
  date_created: Date;



  @UpdateDateColumn({ type: "timestamp" })
  latest_update_date: Date;






  // Realtions many to one

  // @ManyToOne(() => PortalUser, (production) => production.id_user)
  // @JoinColumn({ name: "production_assigned_to" })
  // assigned_to: PortalUser;



  @ManyToOne(() => PcmsMcTemplate, (template) => template.pcms_itr)
  @JoinColumn({ name: "id_template" })
  template: PcmsMcTemplate;

  @OneToMany(() => PcmsItrChecklist, (mc_rel) => mc_rel.id_mc_itr)
  mc_rel: PcmsItrChecklist[];
}