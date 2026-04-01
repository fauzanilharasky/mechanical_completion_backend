import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { sendEmailDto } from './DTO/dto.send_email';
import * as path from 'path';
import * as fs from 'fs';
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationsEmail } from "./notifications_email.entity";
import { Repository } from "typeorm";
import * as ejs from 'ejs';
import axios from 'axios';
import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsEmailService {
  private EMAIL_API_URL: string;
  private JWT_SECRET: string;
  private JWT_EMAIL_TOKEN: string;
  private transporter: nodemailer.Transporter;  

  constructor(
    private configService: ConfigService,

    @InjectRepository(NotificationsEmail, 'portal')
    private readonly _portalEmail: Repository<NotificationsEmail>,

    private readonly mailerService: MailerService

  ) {
    this.EMAIL_API_URL = this.configService.get<string>("EMAIL_API");
    this.JWT_SECRET = this.configService.get<string>("JWT_SECRET");
    this.JWT_EMAIL_TOKEN = this.configService.get<string>("JWT_TOKEN_EMAIL");

   this.transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: this.configService.get<string>('MAIL_USER'),
    pass: this.configService.get<string>('MAIL_PASSWORD'),
  },
});

  this.transporter.verify((err, success) => {
    if (err) {
      console.error("SMTP ERROR:", err);
    } else {
      console.log("SMTP READY");
    }
  });
  }

  // Mendapatkan list email dari portal
  async getPortalEmailList(where?: Record<string, any>) {
    const qb = this._portalEmail.createQueryBuilder('email');

    if (where) {
      Object.entries(where).forEach(([key, value]) => {
        qb.andWhere(`email.${key} = :${key}`, { [key]: value });
      });
    }

    return await qb.getMany();
  }


  private generateJwtToken(secret: string): string {
    return jwt.sign({ app: secret }, this.JWT_SECRET, { expiresIn: "1h" });
  }

  
  // Email Helper
 async sendEmail(data: sendEmailDto) {
  try {
    if (!this.transporter) {
      throw new Error("Transporter not initialized");
    }

    await this.transporter.sendMail({
      from: data.from || `"RFI System" <${process.env.MAIL_USER}>`,
      to: data.email_to.join(','),
      cc: data.email_cc?.length ? data.email_cc.join(',') : undefined,
      bcc: data.email_bcc?.length ? data.email_bcc.join(',') : undefined,
      subject: data.subject,
      html: data.content,
    });

    console.log("Email sent successfully:", data.subject);
  } catch (error) {
    console.error("Send email error:", error);
    throw error;
  }
}

  // Fucntion render template
  renderTemplate(filename: string, data: any) {
    const filePath = path.join(process.cwd(), "src", "notifications_email", "views", filename);
    const template = fs.readFileSync(filePath, "utf8");
    return ejs.render(template, data);
  }





  async sendMail(data: sendEmailDto) {
    try {
      const mailOptions: ISendMailOptions = {
        to: data.email_to,
        subject: data.subject,
        html: data.content,
        attachments: [],
      }
      if (data.email_cc) mailOptions.cc = data.email_cc;
      if (data.email_bcc) mailOptions.bcc = data.email_bcc;

      await this.mailerService.sendMail(mailOptions)

      return { success: true };
    } catch (error) {
      console.error("Email service Error:", error.message);
      return {
        success: false,
      };
    }
  }



  //  async sendMail(data: sendEmailDto) {
  //   try {
      
  //     const mail = await this.mailerService.sendMail({
  //       to: 'fzn.ilhrsky@gmail.com',
  //       from: '"Welcome to the fold" <windows@over.windows>', // sender address
  //       subject: 'Quotes', // Subject line
  //       text: 'Welcome Mechanical Completion', // plaintext body
  //       html: data.content,

  //     });
  //     console.log('TESTINGSSSS', mail);
  //     return {
  //       success: true,
  //     };
  //   } catch (error) {
  //     console.log(error)
  //     return {
  //       success: false,
  //     };
  //   }
  // }
}
