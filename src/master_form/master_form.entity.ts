import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { MasterPhase } from "master_phase/master_phase.entity";
import { MasterDiscipline } from "master_discipline/master_discipline.entity";
import { MasterChecklist } from "master_checklist/master_checklist.entity";
import { PcmsMcTemplate } from "pcms_mc_template/pcms_template.entity";

@Entity({ name: "master_form" })
export class MasterForm {
  static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  cert_id: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  form_code: string;

  @Column({ type: "bigint", nullable: true })
  phase_id: number;

  @Column({ type: "bigint", nullable: true })
  discipline: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  activity_description: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  inspection_type: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  options: string;

  @Column({ type: "bigint", nullable: true })
  created_by: number;

  @CreateDateColumn({ type: "timestamp" })
  created_date: Date;

  @Column({ type: "bigint", nullable: true })
  updated_by: number;

  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updated_date: Date;

  @Column({ type: "bigint", nullable: true })
  deleted_by: number;

  @Column({ type: "timestamp", nullable: true })
  deleted_date: Date;

  @Column({ type: "int", default: 0 })
  status_delete: number;

  @ManyToOne(() => MasterPhase, (phase) => phase.id)
  @JoinColumn({ name: "phase_id" })
  phase: MasterPhase;

  @ManyToOne(() => MasterDiscipline, (discipline) => discipline.id)
  @JoinColumn({ name: "discipline" })
  discipline_rel: MasterDiscipline;

  @OneToMany(() => MasterChecklist, (checklist) => checklist.form)
  checklist: MasterChecklist[];

  @OneToMany(() => PcmsMcTemplate, (template) => template.cert_rel)
  templates: PcmsMcTemplate[];



}

