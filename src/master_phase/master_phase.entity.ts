import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MasterForm } from 'master_form/master_form.entity';


@Entity({ name: 'master_phase'})
export class MasterPhase{
  @PrimaryGeneratedColumn()
  id:number;

  @Column({ type:'varchar', length:255, nullable:true })
  phase_name: string;
 
  @Column({ type:'varchar', length:255, nullable:true })
  phase_code: string;
 

  @OneToMany(() => MasterForm, (form) => form.phase)
  forms: MasterForm[];
}