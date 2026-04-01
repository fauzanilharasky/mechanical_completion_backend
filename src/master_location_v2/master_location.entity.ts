import { MasterArea } from "master_area_v2/master_area.entity";
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

@Entity({ name: "master_location_v2"})
export class MasterLocation {
  static $($: any, arg1: { col: any }, arg2: string) {
    throw new Error("Method not implemented.");
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  name: string;

  @Column({ type: "bigint", nullable: true })
  id_area: number;

  @Column({ type: "bigint", nullable: true })
  created_by: number;

  @Column({ type: "bigint", nullable: true })
  status_delete: number;

  @Column({ type: "bigint", nullable: true })
  category: number;

  @CreateDateColumn({ type: "timestamp", nullable: true })
  created_date: Date;

  @ManyToOne(() => MasterArea, (area) => area.locations)
  @JoinColumn({ name: 'id_area' })
  area: MasterArea;
}