
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';

@Entity('portal_company')
export class PortalCompany {
  @PrimaryGeneratedColumn()
  id_company: number;

  @Column({ name: 'company_code', type: 'varchar', length: 255 })
  company_code: string;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  company_name: string;
  
   @Column({ type: "bigint", nullable: true })
  category: number;

  @Column({ type: "bigint", nullable: true })
  create_by: number;
  
   @CreateDateColumn({ type: "timestamp" })
   create_date: Date;

   @Column({ type: "bigint", nullable: true })
  status_delete: number;

  @Column({ name: 'address', type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'bigint', nullable: true })
  app: number

//   @Column({ type: 'bigint', nullable: true })
//   is_ndt: number;

   @Column({ type: 'bigint', nullable: true })
  restriction_time_group: number;

}




