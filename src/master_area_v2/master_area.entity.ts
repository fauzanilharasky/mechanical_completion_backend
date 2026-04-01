import { MasterLocation } from "master_location_v2/master_location.entity";
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

@Entity({ name: "master_area_v2" })
export class MasterArea {
  static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;


  @Column({ type: "bigint", nullable: true })
  created_by: number;

  @Column({ type: "bigint", nullable: true })
  status_delete: number;

  @CreateDateColumn({ type: "timestamp", nullable: true })
  created_date: Date;

  @OneToMany(() => MasterLocation, (location) => location.area)
  locations: MasterLocation[];

}