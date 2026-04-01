import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'portal_user_db' })
export class User {
  @PrimaryGeneratedColumn()
  id_user: number;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  status_user: number;
}
