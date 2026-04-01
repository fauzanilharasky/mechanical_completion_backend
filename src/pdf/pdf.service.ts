import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as ejs from 'ejs';

@Injectable()
export class PdfService {
  async generatePdf(): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #007bff; }
            .card {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }
            img {
              width: 200px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <h1>Booking Report</h1>
          <div class="card">
            <p>Successfully Report To PDF!</p>
            <img src="https://i.ibb.co.com/GfQhqyY9/mechanical-completion.png" />
          </div>
        </body>
      </html>
    `;
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    const pdfBuffer = Buffer.from(pdfUint8Array);
    await browser.close();
    return pdfBuffer;
  }


  async generatePdf2(htmlContent:any): Promise<Buffer> {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "5mm",
        bottom: "20mm",
        left: "20mm",
        right: "20mm",
      },
    });

    await browser.close();

    return Buffer.from(pdf);
  }

  renderTemplate(filename: string, data: any) {
    const filePath = path.join(process.cwd(), "src", "pdf", "views", filename);
    const template = fs.readFileSync(filePath, "utf8");
    return ejs.render(template, data);
  }


  


}
