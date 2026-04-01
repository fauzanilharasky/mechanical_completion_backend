import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,DeleteDateColumn } from "typeorm";

@Entity({ name: "portal_role_db" })
export class portalRoleDB {
  @PrimaryGeneratedColumn()
  id_role: number;

   @Column({ type: "varchar", length: 255, nullable: true })
 role_name: string;

}
