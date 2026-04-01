import { PcmsMcTemplate } from "pcms_mc_template/pcms_template.entity";
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

@Entity({ name: "master_module" })
export class MasterModule {
  module_name: string;
static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn()
  mod_id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  id_department: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  mod_desc: string;

  @Column({ type: "bigint", nullable: true })
  project_id: number;

  @Column({ type: "bigint", nullable: true })
status: number;

 @Column({ type: "bigint", nullable: true })
status_delete: number;

// relasi database

@OneToMany(() => PcmsMcTemplate, (templates_md) => templates_md.module)
  templates_md: PcmsMcTemplate[];
}