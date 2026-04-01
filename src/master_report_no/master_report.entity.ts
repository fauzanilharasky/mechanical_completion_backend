// import { MasterForm } from 'master_form/master_form.entity';
import { MasterModule } from 'master_module/master_module.entity';
import { MasterTypeModule } from 'master_typemodule/master_typemodule.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PcmsITR } from 'pcms_itr/pcms_itr.entity';

@Entity({ name: 'master_report_no'})
export class MasterReportNo {

    @PrimaryGeneratedColumn()
    id: number;

     @Column({ type: "bigint", nullable: true })
    discipline: number;

     @Column({ type: "bigint", nullable: true })
    project: number;

    @Column({ type: "bigint", nullable: true })
    module: number;

    @Column({ type: "bigint", nullable: true })
    type_of_module: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    company_id: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    category: string;

    @Column({ type: "varchar", length: 255, nullable: true})
    report_no: string;

    @CreateDateColumn({ type: "timestamp" })
    created_date: Date;



     @Column({ type: "bigint", nullable: true })
  status_delete: number;


  //  @ManyToOne(() => PcmsITR, (report) => report.id)
  //   @JoinColumn({ name: "report_no" })
  //   report: PcmsITR;
  // report_no: string;
  
//      @ManyToOne(() => MasterModule, (mastermodule) => mastermodule.mod_id)
//     @JoinColumn({ name: "module" })
//     templates_md: MasterModule;
  
}