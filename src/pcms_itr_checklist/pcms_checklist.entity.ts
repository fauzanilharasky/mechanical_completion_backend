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

import { PcmsITR } from "pcms_itr/pcms_itr.entity";
import { MasterChecklist } from "master_checklist/master_checklist.entity";

@Entity({ name: "pcms_itr_checklist"})
export class PcmsItrChecklist {
  @PrimaryGeneratedColumn()
    id: number;

  @Column({ type: "bigint", nullable: true })
  id_mc_itr: number;

  @Column({ type: "bigint", nullable: true })
  id_form_checklist: number;

  @Column({ type: "varchar", length: 255, nullable: true})
  result: string;

  @Column({ type: "varchar", length: 255, nullable: true})
  remarks: string;

  @Column({ type: "bigint", nullable: true})
  created_by: number;

  @CreateDateColumn({ type: "timestamp" })
  created_date: Date;

  @Column({ type: "bigint", nullable: true})
  updated_by: number;

  @UpdateDateColumn({ type: 'timestamp'})
  updated_date: Date;

  @ManyToOne(() => PcmsITR, (mc_itr) => mc_itr.id_itr)
  @JoinColumn({ name: "id_mc_itr" })
  mc_rel: PcmsITR;

   @ManyToOne(() => MasterChecklist, (formChecklist) => formChecklist.id)
  @JoinColumn({ name: "id_form_checklist" })
  form_mc: PcmsITR;
}