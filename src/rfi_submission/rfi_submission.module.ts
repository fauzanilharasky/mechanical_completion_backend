import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfiSubmissionService } from './rfi_submission.service';
import { RfiSubmissionController } from './rfi_submission.controller';
import { McTemplate } from './rfi_submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([McTemplate])],
  providers: [RfiSubmissionService],
  controllers: [RfiSubmissionController],
})
export class RfiSubmissionModule {}
