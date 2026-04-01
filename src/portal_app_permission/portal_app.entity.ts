import { portalPermission } from "portal_permissions/portal_permissions.entity";
import {
    Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn,DeleteDateColumn } from "typeorm";

@Entity({ name: "portal_app_permission" })
export class portalAppPermission {
  @PrimaryGeneratedColumn()
  id_application: number;

   @Column({ type: "varchar", length: 255, nullable: true })
  app_name: string;

   @CreateDateColumn({ type: "timestamp" })
  created_date: Date;

  @OneToMany(() => portalPermission, (permission) => permission.portalApp)
  permissions: portalPermission[];
}
