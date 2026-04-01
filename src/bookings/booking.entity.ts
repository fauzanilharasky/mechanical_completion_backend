import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'bookings' })
export class Bookings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  facility_id: number;

  @Column()
  session_id: number;

  @Column({ type: 'date' })
  book_date: Date;

  @Column({ type: 'timestamp' })
  created_date: Date;

  @Column()
  created_by: number;

  @Column()
  remarks: string;
}
