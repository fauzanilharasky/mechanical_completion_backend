import { Module } from '@nestjs/common';
import { ExportController} from './export_excel.controller';
import { ExportService } from './export_excel.services';
@Module({
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
