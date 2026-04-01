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

@Entity({ name: "master_type_of_module" })
export class MasterTypeModule {
    static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  code: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  @Column({ type: "int", default: 0 })
  status_delete: number;

  @CreateDateColumn({ type: "timestamp" })
  created_date: Date;

  // relasi
  @OneToMany(() => PcmsMcTemplate, (template) => template.type_of_module)
  templates: PcmsMcTemplate[];
}