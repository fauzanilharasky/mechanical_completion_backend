import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pcms_mc_template')
export class McTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  project_id: number;

  @Column({ nullable: true })
  tag_number: string;

  @Column({ nullable: true })
  tag_description: string;

  @Column({ nullable: true })
  module: string;

  @Column({ nullable: true })
  type_of_module: string;

  @Column({ nullable: true })
  drawing_no: string;

  @Column({ nullable: true })
  subsystem_description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  model_no: string;

  @Column({ nullable: true })
  serial_no: string;

  @Column({ nullable: true })
  rating: string;

  @Column({ nullable: true })
  status_delete: string;

  @Column({ nullable: true })
  manufacturer: string;

  @Column({ nullable: true })
  company_id: number;
}
