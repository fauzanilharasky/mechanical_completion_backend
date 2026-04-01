import { PcmsITR } from "pcms_itr/pcms_itr.entity";
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

@Entity({ name: "portal_user_db"})
export class PortalUser {

 @PrimaryGeneratedColumn('increment')
  id_user: number;

  static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }

  @Column({ type: "varchar", length: 255, nullable: true})
  username: string;

 @Column({ type: "varchar", length: 255, nullable: true })
  badge_no: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  full_name: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @CreateDateColumn({ type: 'timestamp' }) 
  created_date: Date;

  @Column({ type: "bigint", nullable: true })
  status_user: number;

  @UpdateDateColumn({ type: 'timestamp' }) 
  last_update: Date;  
  
  @Column({ type: "bigint", nullable: true })
  update_by: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  password: string;

  @Column({ type: "bigint", nullable: true })
  company: number;

  @Column({ type: "bigint", nullable: true })
  project_id: number;

  @Column({ type: "bigint", nullable: true })
  id_role: number;





  // Relations one to many
  // @OneToMany(() => PcmsITR, (itr) => itr.production_assigned_to)
  //   assigned_itr: PcmsITR[];
}