import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "portal_email_notification" })
export class NotificationsEmail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    group_name: number;

    @Column()
    process: string;

    @Column()
    email_to: string;
    
    @Column()
    email_cc: string;
    
    @Column()
    email_bcc: string;
    
    @Column()
    status: string;
    
    @Column()
    project: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_date: Date;
    
    @Column({ nullable: true })
    created_by: number;
    
    @Column()
    status_delete: number;

    @Column()
    dept_id: number;

    @Column()
    company_id: number;
    
}
