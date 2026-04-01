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
import { PortalProject } from "portal_project/portal_project.entity";
import { Subsystem } from "master_subsystem/subsystem.entity";

@Entity({ name: "master_system" })
export class MasterSystem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint", nullable: true })
  project_id: number;

  // @ManyToOne(() => PortalProject, (Project) => Project.id)
  //   @JoinColumn({ name: "project_id" })
  //   project: PortalProject;

  @Column({ type: "varchar", length: 255, nullable: true })
  system_name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string;

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

  @Column({ type: "timestamp", nullable: true })
  deleted_date: Date;

  @Column({ type: "int", default: 0 })
  status_delete: number;

 

  @OneToMany(() => MasterSystem, (system) => system.system_rel)
  system_rel: MasterSystem[];
  
  @OneToMany(() => Subsystem, (subsystem) => subsystem.system)
  subsystems: Subsystem[];

  // project_name: string;
  
}