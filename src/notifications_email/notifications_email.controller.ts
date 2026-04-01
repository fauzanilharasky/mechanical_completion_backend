import { Body, Controller, InternalServerErrorException, Post } from "@nestjs/common";
import { NotificationsEmailService } from "./notifications_email.service";
import path from "path";
import { sendEmailDto } from './DTO/dto.send_email';
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("api/email")
@ApiBearerAuth('access-token')
export class NotificationsEmailController {
  constructor(private email: NotificationsEmailService) { }

  @Post("/test")
  async sendEmail(@Body() data: sendEmailDto) {

    const view_data = {
      name: 'REQ-0001',
      list: [
        {
          item: 'FAUZAN',
          qty: 5,
        },
      ],
    };

    var content = this.email.renderTemplate("testing_email.ejs", view_data)
    data.content = content
    let send = await this.email.sendEmail(data);
    return send;
  }

// @Post("/testings")
// async sendMail(@Body() data: sendEmailDto) {
//   const viewData = {
//     name: 'FZN-000010',
//     list: [
//       {
//         item: 'FAUZAN ILHARASKY',
//         qty: 10,
//         discipline: 'EMPIRE',
//       },
//     ],
//   };

//   const content = this.email.renderTemplate("testing_email.ejs", viewData);

//   const payload = {
//     ...data,
//     content,
//   };

//   return await this.email.sendMail(payload);
// }



@Post("/testings")
async sendMail(@Body() data: sendEmailDto) {
  try {
    const viewData = {
      submission_no: "SMO-EW1-OSS-0001",
      system: "System A",
      legend_inspection_auth: "monitoring",
      status: "RFI Transmittal To Client",
      approvalLink:
        "http://172.60.20.60:3001/master_data_new/rfi_submission/submission_qc/transmittal_by_qc",
    };

    const content = this.email.renderTemplate("testing_email.ejs", viewData);

    const payload = {
      ...data,
      content,
    };

    // pastikan service method benar: biasanya sendEmail(...)
    if (typeof this.email.sendEmail === "function") {
      return await this.email.sendEmail(payload);
    }

    // fallback jika service implement sendMail
    if (typeof this.email.sendMail === "function") {
      return await this.email.sendMail(payload);
    }

    throw new InternalServerErrorException("Email service method not available");
  } catch (err) {
    console.error("notifications_email.sendMail error:", err);
    throw new InternalServerErrorException(err?.message ?? "Failed to send test mail");
  }

}

}
