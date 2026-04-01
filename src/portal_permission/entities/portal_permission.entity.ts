import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,DeleteDateColumn } from "typeorm";

@Entity({ name: "portal_user_permission" })
export class portalUserPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint", nullable: true })
  id_user: number;

   @Column({ type: "varchar", length: 255, nullable: true })
  id_portal_app_permission: string;

   @Column({ type: "varchar", length: 255, nullable: true })
  id_portal_permission: string;

   @Column({ type: "varchar", length: 255, nullable: true })
  index_key: string;

  @Column({ type: "bigint", nullable: true })
  create_by: number;

  @CreateDateColumn({ type: "timestamp" })
  create_date: Date;
}
