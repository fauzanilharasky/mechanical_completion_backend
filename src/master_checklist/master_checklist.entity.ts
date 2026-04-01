import { MasterForm } from 'master_form/master_form.entity';
import { PcmsItrChecklist } from 'pcms_itr_checklist/pcms_checklist.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

@Entity({ name: 'master_form_checklist'})
export class MasterChecklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({  type: 'bigint', nullable: true })
  form_id: number;

  @Column({type: 'varchar', length: 255, nullable: true })
  group_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  item_no: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @Column({ type: 'bigint', nullable: true })
  created_by: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_date: Date;

  @Column({ type: 'bigint', nullable: true })
  updated_by: number;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_date: Date;

  @Column({ type: 'bigint', nullable: true })
  deleted_by: number;

  @Column({ type: 'timestamp', nullable: true })
  deleted_date: Date;

  @Column({ type: 'int', default: 0 })
  status_delete: number;
  
  @ManyToOne(() => MasterForm, (form) => form.checklist)
  @JoinColumn({ name: 'form_id'})
  form : MasterForm;

   @OneToMany(() => PcmsItrChecklist, (form_mc) => form_mc.id_form_checklist)
    form_mc: PcmsItrChecklist[];

}
