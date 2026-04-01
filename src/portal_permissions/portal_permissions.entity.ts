import { portalAppPermission } from "portal_app_permission/portal_app.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, JoinColumn } from 'typeorm';


@Entity({ name: "portal_permission" })
export class portalPermission {
  @PrimaryGeneratedColumn()
  id_permission: number;

   @Column({ type: "bigint", nullable: true })
  id_app_permission: number;

   @Column({ type: "varchar", length: 255, nullable: true })
  permission_group: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  permission_name: string;

   @Column({ type: "varchar", length: 255, nullable: true })
  index_key: string;

  @CreateDateColumn({ type: "timestamp" })
  created_date: Date;

  @ManyToOne(() => portalAppPermission, (app) => app.id_application)
  @JoinColumn({ name: "id_app_permission" })
  portalApp: portalAppPermission;
  id_portal_permission: any;
}
