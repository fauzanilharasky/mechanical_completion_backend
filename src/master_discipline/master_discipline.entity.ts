import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MasterForm } from 'master_form/master_form.entity';
import { PcmsMcTemplate } from 'pcms_mc_template/pcms_template.entity';


@Entity({ name: 'master_discipline'})
export class MasterDiscipline{
  @PrimaryGeneratedColumn()
  id:number;

  @Column({ type:'varchar', length:255, nullable:true })
  initial: string;

  @Column({ type: 'int', nullable: true })  
  status: number;
 
  @Column({ type: 'int', nullable: true })  
  warehouse_status: number;

  @Column({ type:'varchar', length:255, nullable:true })
  discipline_name: string;
  

   @Column({ type: 'int', nullable: true })  
  production_status: number;

  @OneToMany(() => MasterDiscipline, (form) => form.discipline_rel)
  discipline_rel: MasterForm[];

   
  @OneToMany(() => MasterDiscipline, (form) => form.discipline_tag)
  discipline_tag: PcmsMcTemplate[];

  

}