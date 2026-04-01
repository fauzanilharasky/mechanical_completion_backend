import { Controller, Get, Param, Res } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { Public } from '../public.decorator';
import { PcmsITR } from '../pcms_itr/pcms_itr.entity';

@Controller('api/pdf')
export class PdfController {
  pcmsItrRepo: any;
  constructor(private readonly pdfService: PdfService) {}

  @Public()
  @Get('download')
  async downloadPdf(@Res() res) {
    const pdfBuffer = await this.pdfService.generatePdf();
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="booking-report.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }


   @Public()
  @Get("/testing")
  async generatepdf(@Res() res) {
    let view_data = {
      header: {
        drawing_no: "001",
        project_name: "gamma"
      }
    };
    const htmlContent = this.pdfService.renderTemplate("export_pdf.ejs", view_data);
    console.log(htmlContent, "testing HTML CONTENT: ");
    const pdfBuffer = await this.pdfService.generatePdf2(htmlContent);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Mechanical_completion_data.pdf"',
      "Content-Length": pdfBuffer.length
    });
    res.end(pdfBuffer);
  }

  


//   @Get("export-pdf/:id")
// async exportPdf(
//   @Param("id") id: number,
//   @Res() res: Response
// ) {
//   const pdfBuffer = await this.pcmsItrRepo.generatePdf(id);

//   res.set({
//     "Content-Type": "application/pdf",
//     "Content-Disposition": `inline; filename=inspection-${id}.pdf`,
//   });

//   res.send(pdfBuffer);
// }
}

