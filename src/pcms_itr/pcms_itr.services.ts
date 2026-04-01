import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Like, Repository, DataSource } from 'typeorm';
import { PcmsITR } from "./pcms_itr.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AssignItrDto } from "../DTO/dto.assignment_itr";
import { PortalUser } from "portal_user_db/portal_user.entity";
import { PcmsMcTemplate } from "pcms_mc_template/pcms_template.entity";
import { AesEcbService } from "crypto/aes-ecb.service";
import { MasterReportNo } from "master_report_no/master_report.entity";
import { UpdateRfiDto } from "DTO/dto.submit_rfi";
import { PortalCompany } from "portal_company/portal_company.entity";
import { PortalProject } from "portal_project/portal_project.entity";
import { PcmsItrChecklist } from "pcms_itr_checklist/pcms_checklist.entity";
import { sendEmailDto } from "notifications_email/DTO/dto.send_email";
import { GenerateExcelDto } from "DTO/dto.generate_excel";
import { ExportService } from "export_excel/export_excel.services";
import { NotificationsEmailService } from "notifications_email/notifications_email.service";
import { MasterLocation } from "master_location_v2/master_location.entity";
import * as puppeteer from "puppeteer";
import * as ejs from "ejs";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class PcmsItrService {
  MasterReportNo: any;
  excel: any;
  constructor(
    @InjectRepository(PcmsITR)
    private readonly pcmsItrRepo: Repository<PcmsITR>,

    @InjectRepository(PortalUser, "portal")
    private readonly portalUserRepo: Repository<PortalUser>,

    @InjectRepository(MasterReportNo)
    private readonly ReportRepo: Repository<MasterReportNo>,

    @InjectRepository(PcmsMcTemplate)
    private readonly pcmsTemplateRepo: Repository<PcmsMcTemplate>,
    
    @InjectRepository(PortalUser, 'portal')
    private readonly PortalUserRepo: Repository<PortalUser>,
    
    @InjectRepository(PortalCompany, "portal")
    private readonly _Portal_Company: Repository<PortalCompany>,
    
    @InjectRepository(PortalProject, "portal")
    private readonly _project: Repository<PortalProject>,
    private readonly email: NotificationsEmailService,
    private readonly aesEcb: AesEcbService,
    private readonly exportService: ExportService,
    private readonly dataSource: DataSource,

  ) { }

  async findAll(_queryDto: ServerSideDTO): Promise<PcmsITR[]> {
    return this.pcmsItrRepo.find();
  }

  async findOne(id: number): Promise<PcmsITR> {
    return this.pcmsItrRepo.findOne({ where: { id_itr: id } });
  }

  async create(data: Partial<PcmsITR>, userId: number): Promise<PcmsITR> {
    const entity = this.pcmsItrRepo.create({
      ...data,
    });
    return this.pcmsItrRepo.save(entity);
  }

  async update(id: number, data: Partial<PcmsITR>): Promise<PcmsITR> {
    await this.pcmsItrRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.pcmsItrRepo.delete(id);

  }


    // CHART IN THE DASHBOARD

  async dashboardSummary(queryDto: ServerSideDTO) {
    const result = await this.pcmsItrRepo
      .createQueryBuilder("itr")
      .select("itr.status_inspection", "status")
      .addSelect("COUNT(*)", "total")
      .groupBy("itr.status_inspection")
      .getRawMany();

    const summary = {
      pending_spv: 0,
      totals: 0,
      pending_qc: 0,
      rejected_qc: 0,
      approved_qc: 0,
      approve_client:0,
      pending_client:0,
      comment:0,
      completed:0,
    };

    const allowedStatus = [1,2,3,4,5,6,7,8,9,10,11];

    result.forEach((row) => {
     const status = Number(row.status);
    const total = Number(row.total);

    // TOTAL HANYA STATUS 1 - 11
    if (allowedStatus.includes(status)) {
      summary.totals += total;
    }

      if (row.status == 1) summary.pending_spv = Number(row.total);
      if (row.status == 3) summary.pending_qc = Number(row.total);
      if (row.status == 4) summary.rejected_qc = Number(row.total);
      if (row.status == 5) summary.approved_qc = Number(row.total);
      if (row.status == 6) summary.pending_client = Number(row.total);
      if (row.status == 8) summary.completed = Number(row.total);
      if (row.status == 11) summary.comment = Number(row.total);
    });

    return summary;
  }




  //  ----------------- DETAILS REJECT SUPERVISOR -----------------------

  async rejectDetailSpv(submissionId: string) {
    const itrList = await this.pcmsItrRepo.find({
      where: { submission_id: submissionId },
      order: { id_itr: "ASC" },
    });

    if (!itrList.length) {
      return [];
    }

    const templateIds = itrList.map((i) => i.id_template);

    const qb = this.pcmsTemplateRepo
      .createQueryBuilder("pcmstemplate")
      .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
      .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
      .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
      .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
      .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
      .leftJoinAndSelect("pcmstemplate.cert_rel", "cert_rel")
      .leftJoinAndSelect("cert_rel.checklist", "checklist")
      .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
      .leftJoinAndMapMany(
        "checklist.checklist_results",
        PcmsItrChecklist,
        "itrChecklist",
        "itrChecklist.id_mc_itr = itr.id_itr"
      )
      .where("pcmstemplate.id IN (:...ids)", { ids: templateIds })
      .andWhere("itr.submission_id = :sid", { sid: submissionId })
      .orderBy("checklist.item_no", "ASC");


    const templateData = await qb.getMany();

    const userIds = [
      ...new Set(
        templateData.flatMap((t: any) =>
          (t.pcms_itr || []).map((i: any) => Number(i.requestor))
        )
      ),
    ].filter((id) => id);

    const users = userIds.length
      ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
      : [];

    const userMap = Object.fromEntries(
      users.map((u: any) => [u.id_user, u.full_name])
    );

    const projectIds = [
      ...new Set([
        ...templateData.flatMap((t: any) => (t.pcms_itr || []).map((i: any) => i.project_id)),
        ...templateData.map((t: any) => t.project_id),
      ].filter(Boolean)),
    ];

    const companyIds = [
      ...new Set([
        ...templateData.flatMap((t: any) => (t.pcms_itr || []).map((i: any) => i.company_id)),
        ...templateData.map((t: any) => t.company_id),
      ].filter(Boolean)),
    ];

    // Ambil data project & company
    const projects = await this._project.findBy({ id: In(projectIds) });
    const companies = await this._Portal_Company.findBy({
      id_company: In(companyIds),
    });

    const projectMap = Object.fromEntries(
      projects.map((p) => [p.id, p.project_name])
    );

    const companyMap = Object.fromEntries(
      companies.map((c) => [c.id_company, c.company_name])
    );

    const rows = templateData.map((t: any) => {

      const itrArray = Array.isArray(t.pcms_itr) ? t.pcms_itr : [];
      const itr = itrArray.find((i: any) => i.submission_id === submissionId);

      const certRelArray = Array.isArray(t.cert_rel)
        ? t.cert_rel
        : t.cert_rel
          ? [t.cert_rel]
          : [];


      const checklistMapped = certRelArray.map((cert: any) => ({
        ...cert,

        checklist: cert.checklist?.map((item: any) => {
          // FILTER hasil yg cocok dgn checklist ini
          const matchedResult = (item.checklist_results || []).find(
            (res: any) =>
              res.id_form_checklist === item.id &&
              res.id_mc_itr === itr?.id_itr
          );

          return {
            ...item,
            result: matchedResult?.result ?? null,
            remarks: matchedResult?.remarks ?? "",

            result_ok: matchedResult?.result === "OK",
            result_na: matchedResult?.result === "NA",
            result_pl: matchedResult?.result === "PL",
          };
        }),

      }));



      return {
        ...t,
        cert_rel: checklistMapped,
        submission_id: itr?.submission_id,
        date_request: itr?.date_request,
        status_inspection: itr?.status_inspection,
        report_resubmit_status: itr?.report_resubmit_status,
        requestor_name: userMap[itr?.requestor] ?? "Not Set",
        project_name: projectMap[itr?.project_id ?? t.project_id] || "Not Set",
        company_name: companyMap[itr?.company_id ?? t.company_id] || "Not Set",
      };
    });

    return {
      data: rows,
      total: rows.length,
    };
  }


  // GET DATA TO PDF

 async generatePdf(): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = `
  <html>
  <head>
    <style>
      body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #000;
    }

    h1 {
      text-align: center;
      margin-bottom: 5px;
    }

    .sub-title {
      text-align: center;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .header-box {
      border: 1px solid #000;
      padding: 10px;
      margin-bottom: 20px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .header-row div {
      width: 48%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 25px;
    }

    table, th, td {
      border: 1px solid #000;
    }

    th {
      background: #f2f2f2;
      font-weight: bold;
      text-align: center;
      padding: 5px;
    }

    td {
      padding: 4px;
    }

    .center {
      text-align: center;
    }

    .left {
      text-align: left;
    }

    .tag-title {
      font-weight: bold;
      margin-top: 15px;
      margin-bottom: 5px;
    }
  </style>
  </head>

  <img src="https://i.ibb.co.com/GfQhqyY9/mechanical-completion.png" />
 <body>
  <h1>MECHANICAL COMPLETION</h1>
  <div class="sub-title">
    Inspection & Test Record - QC
  </div>

  <!-- HEADER INFORMATION -->
  <div class="header-box">
    <div class="header-row">
      <div><strong>Drawing No:</strong> <%= header?.drawing_no || '-' %></div>
      <div><strong>Project:</strong> <%= header?.project_name || '-' %></div>
    </div>
  </div>

  <!-- LOOP PER TAG NUMBER -->
  <% if (Array.isArray(groupedData)) { %>
    <% groupedData.forEach(tag => { %>

      <div class="tag-title">
        Tag Number: <%= tag.tag_number %>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:50px;">Item</th>
            <th>Description</th>
            <th style="width:40px;">OK</th>
            <th style="width:40px;">NA</th>
            <th style="width:40px;">PL</th>
            <th style="width:150px;">Comments</th>
          </tr>
        </thead>
        <tbody>
          <% tag.items.forEach(item => { %>
            <tr>
              <td class="center"><%= item.item_no %></td>
              <td class="left"><%= item.description %></td>
              <td class="center"><%= item.result === "OK" ? "✔" : "" %></td>
              <td class="center"><%= item.result === "NA" ? "✔" : "" %></td>
              <td class="center"><%= item.result === "PL" ? "✔" : "" %></td>
              <td class="left"><%= item.remarks || "" %></td>
            </tr>
          <% }) %>
        </tbody>
      </table>

    <% }) %>
  <% } %>

</body>
</html> `;
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


  // RENDER TEMPLATE TO PDF 
  
  renderTemplate(templateName: string, data: any) {

  const filePath = path.join(
    process.cwd(),
    "src",
    "pdf",
    "views",
    templateName
  );

    if (!fs.existsSync(filePath)) {
      throw new Error(`Template tidak ditemukan: ${filePath}`);
    }

    const template = fs.readFileSync(filePath, "utf8");

      return ejs.render(template, data);
    }

    // END EXPORT FILE TO PDF





  // ----------------- Details Inspection RFI ---------------------------\

  async getDetailBySubmission(submissionId: string) {
    const itrList = await this.pcmsItrRepo.find({
      where: { submission_id: submissionId },
      order: { id_itr: "ASC" },
    });

    if (!itrList.length) {
    return {
      data: [],
      total: 0
    };
}

    const templateIds = itrList.map((i) => i.id_template);

    const qb = this.pcmsTemplateRepo
      .createQueryBuilder("pcmstemplate")
      .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
      .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
      .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
      .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
      .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
      .leftJoinAndSelect("pcmstemplate.cert_rel", "cert_rel")
      .leftJoinAndSelect("cert_rel.checklist", "checklist")
      .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
      .leftJoinAndMapMany(
        "checklist.checklist_results",
        PcmsItrChecklist,
        "itrChecklist",
        "itrChecklist.id_mc_itr = itr.id_itr"
      )
      .where("pcmstemplate.id IN (:...ids)", { ids: templateIds })
      .andWhere("itr.submission_id = :sid", { sid: submissionId })
      .orderBy("checklist.item_no", "ASC");


    const templateData = await qb.getMany();

    const userIds = [
      ...new Set(
        templateData.flatMap((t: any) =>
          (t.pcms_itr || []).map((i: any) => Number(i.requestor))
        )
      ),
    ].filter((id) => id);

    const users = userIds.length
      ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
      : [];

    const userMap = Object.fromEntries(
      users.map((u: any) => [u.id_user, u.full_name])
    );

    const projectIds = [
      ...new Set([
        ...templateData.flatMap((t: any) => (t.pcms_itr || []).map((i: any) => i.project_id)),
        ...templateData.map((t: any) => t.project_id),
      ].filter(Boolean)),
    ];

    const companyIds = [
      ...new Set([
        ...templateData.flatMap((t: any) => (t.pcms_itr || []).map((i: any) => i.company_id)),
        ...templateData.map((t: any) => t.company_id),
      ].filter(Boolean)),
    ];

    // Ambil data project & company
    const projects = await this._project.findBy({ id: In(projectIds) });
    const companies = await this._Portal_Company.findBy({
      id_company: In(companyIds),
    });

    const projectMap = Object.fromEntries(
      projects.map((p) => [p.id, p.project_name])
    );

    const companyMap = Object.fromEntries(
      companies.map((c) => [c.id_company, c.company_name])
    );

    const rows = templateData.map((t: any) => {


      const itrArray = Array.isArray(t.pcms_itr) ? t.pcms_itr : [];
      const itr = itrArray.find((i: any) => i.submission_id === submissionId);

       const checklistArray = Array.isArray(t.pcms_itr) ? t.pcms_itr : [];
      const checklist = checklistArray.find((i: any) => i.submission_id === submissionId);

      const certRelArray = Array.isArray(t.cert_rel)
        ? t.cert_rel
        : t.cert_rel
          ? [t.cert_rel]
          : [];


      const checklistMapped = certRelArray.map((cert: any) => ({
        ...cert,

        checklist: cert.checklist?.map((item: any) => {
          // FILTER hasil yg cocok dgn checklist ini
          const matchedResult = (item.checklist_results || []).find(
            (res: any) =>
              res.id_form_checklist === item.id &&
              res.id_mc_itr === itr?.id_itr
          );

          return {
            ...item,
            result: matchedResult?.result ?? null,
            remarks: matchedResult?.remarks ?? "",

            result_ok: matchedResult?.result === "OK",
            result_na: matchedResult?.result === "NA",
            result_pl: matchedResult?.result === "PL",
          };
        }),

      }));


      

      return {
        ...t,
        cert_rel: checklistMapped,
        submission_id: itr?.submission_id,
        date_request: itr?.date_request,
        status_inspection: itr?.status_inspection,
        report_resubmit_status: itr?.report_resubmit_status,
        requestor_name: userMap[itr?.requestor] ?? "Not Set",
        project_name: projectMap[itr?.project_id ?? t.project_id] || "Not Set",
        company_name: companyMap[itr?.company_id ?? t.company_id] || "Not Set",
        system: checklist.system_rel?.system_name || "-",
        discipline: checklist.discipline_tag?.discipline_name || "-"
      };
    });

    return {
      data: rows,
      total: rows.length,
    };
  }



  
  // ---------------------------------- SUMMARY DETAILS IN RFI -----------------------------

   async getSummaryDetails(submissionId: string) {
    const itrList = await this.pcmsItrRepo.find({
      where: { submission_id: submissionId },
      order: { id_itr: "ASC" },
    });

    if (!itrList.length) {
      return [];
    }

    const templateIds = itrList.map((i) => i.id_template);

    const qb = this.pcmsTemplateRepo
      .createQueryBuilder("pcmstemplate")
      .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
      .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
      .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
      .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
      .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
      .leftJoinAndSelect("pcmstemplate.cert_rel", "cert_rel")
      .leftJoinAndSelect("cert_rel.checklist", "checklist")
      .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
      .leftJoinAndMapMany(
        "checklist.checklist_results",
        PcmsItrChecklist,
        "itrChecklist",
        "itrChecklist.id_mc_itr = itr.id_itr"
      )
      .where("pcmstemplate.id IN (:...ids)", { ids: templateIds })
      .andWhere("itr.submission_id = :sid", { sid: submissionId })
      .orderBy("checklist.item_no", "ASC");


    const templateData = await qb.getMany();

    const userIds = [
      ...new Set(
        templateData.flatMap((t: any) =>
          (t.pcms_itr || []).map((i: any) => Number(i.requestor))
        )
      ),
    ].filter((id) => id);

    const users = userIds.length
      ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
      : [];

    const userMap = Object.fromEntries(
      users.map((u: any) => [u.id_user, u.full_name])
    );

    const projectIds = [
      ...new Set([
        ...templateData.flatMap((t: any) => (t.pcms_itr || []).map((i: any) => i.project_id)),
        ...templateData.map((t: any) => t.project_id),
      ].filter(Boolean)),
    ];

    const companyIds = [
      ...new Set([
        ...templateData.flatMap((t: any) => (t.pcms_itr || []).map((i: any) => i.company_id)),
        ...templateData.map((t: any) => t.company_id),
      ].filter(Boolean)),
    ];

    // Ambil data project & company
    const projects = await this._project.findBy({ id: In(projectIds) });
    const companies = await this._Portal_Company.findBy({
      id_company: In(companyIds),
    });

    const projectMap = Object.fromEntries(
      projects.map((p) => [p.id, p.project_name])
    );

    const companyMap = Object.fromEntries(
      companies.map((c) => [c.id_company, c.company_name])
    );

    const rows = templateData.map((t: any) => {


      const itrArray = Array.isArray(t.pcms_itr) ? t.pcms_itr : [];
      const itr = itrArray.find((i: any) => i.submission_id === submissionId);

      const certRelArray = Array.isArray(t.cert_rel)
        ? t.cert_rel
        : t.cert_rel
          ? [t.cert_rel]
          : [];


      const checklistMapped = certRelArray.map((cert: any) => ({
        ...cert,

        checklist: cert.checklist?.map((item: any) => {
          // FILTER hasil yg cocok dgn checklist ini
          const matchedResult = (item.checklist_results || []).find(
            (res: any) =>
              res.id_form_checklist === item.id &&
              res.id_mc_itr === itr?.id_itr
          );

          return {
            ...item,
            result: matchedResult?.result ?? null,
            remarks: matchedResult?.remarks ?? "",

            result_ok: matchedResult?.result === "OK",
            result_na: matchedResult?.result === "NA",
            result_pl: matchedResult?.result === "PL",
          };
        }),

      }));



      return {
        ...t,
        cert_rel: checklistMapped,
        submission_id: itr?.submission_id,
        date_request: itr?.date_request,
        status_inspection: itr?.status_inspection,
        report_resubmit_status: itr?.report_resubmit_status,
        requestor_name: userMap[itr?.requestor] ?? "Not Set",
        project_name: projectMap[itr?.project_id ?? t.project_id] || "Not Set",
        company_name: companyMap[itr?.company_id ?? t.company_id] || "Not Set",
      };
    });

    return {
      data: rows,
      total: rows.length,
    };
  }


  // -------------- assignment ITR to production -------------

  async assignmentItr(data: Partial<AssignItrDto>): Promise<void> {
    const { user_id, templates, production_assigned_by } = data;

    if (!user_id || !templates?.length) {
      throw new Error("Missing user_id or templates array");
    }

    if (!production_assigned_by) {
      throw new BadRequestException("Missing production_assigned_by");
    }

    const decrypted = this.aesEcb.decryptBase64Url(
      String(production_assigned_by)
    );
    const decryptedUserId = parseInt(decrypted, 10);

    if (isNaN(decryptedUserId)) {
      throw new BadRequestException(
        "Invalid decrypted user ID for production_assigned_by"
      );
    }

    const user = await this.portalUserRepo.findOne({
      where: { id_user: user_id },
    });
    if (!user) throw new Error("User not found in portal_user_db");

    for (const id_template of templates) {
      const template = await this.pcmsTemplateRepo.findOne({
        where: { id: id_template },
      });
      if (!template) continue;

      // Insert data baru ke pcms_itr
      const itr = this.pcmsItrRepo.create({
        id_template: template.id,
        production_assigned_to: user.id_user,
        date_created: new Date(),
        production_assigned_by: decryptedUserId,
        production_assigned_date: new Date(),
      });
      await this.pcmsItrRepo.save(itr);

      // Update status template jadi assigned (1)
      template.assignment_status = 1;
      await this.pcmsTemplateRepo.save(template);
    }
  }



  // UPDATE USER ITR ASSIGNMENT

async updateUser(dto: AssignItrDto) {
  let updated = 0;

  for (const id_itr of dto.id_itr) {
  

    const user = await this.portalUserRepo.findOne({
      where: { id_user: dto.production_assigned_to },
    });

    if (!user) {
      throw new NotFoundException(
        `User ${dto.production_assigned_to} not found in portal_user_db`
      );
    }

    const result = await this.pcmsItrRepo.update(
      { id_itr:id_itr }, // WHERE ITR ID
      {
        production_assigned_to: user.id_user,
        // production_assigned_by: decryptedUserId,
        production_assigned_date: new Date(),
        // assignment_status: 1,
      }
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        `ITR with id ${id_itr} not found`
      );
    }

    updated += result.affected;
  }

  return {
    message: "Assignment updated successfully",
    total_updated: updated,
  };
}




  // ------------------------ Transmittal To Update By QC -----------------------------

async updateTransmit(dtos: UpdateRfiDto[]) {
  console.log(dtos);

  const itrIds: number[] = [];

  //Updated data

  for (const dto of dtos) {
    const { id_itr, ...updateData } = dto;

    const result = await this.pcmsItrRepo.update(
      { id_itr },
      updateData,
    );

    if (result.affected === 0) {
      throw new NotFoundException(
        `RFI with id_itr not found`,
      );
    }

    itrIds.push(id_itr);
  }

  const itrData = await this.pcmsItrRepo.find({
    where: { id_itr: In(itrIds) },
    relations: [
      'template',
      'template.discipline_tag',
      'template.system_rel',
      'template.subsystem_rel',
      'template.templates_md',
    ],
  });

  if (!itrData.length) {
    return {
      message: 'RFI Transmittal successfully',
      total_updated: dtos.length,
    };
  }


  const userIds = new Set<number>();

  itrData.forEach(itr => {
    if (itr.requestor) userIds.add(Number(itr.requestor));
    if (itr.inspection_by) userIds.add(Number(itr.inspection_by));
  });

  const users = await this.PortalUserRepo.find({
    where: { id_user: In(Array.from(userIds)) }
  });

  const userMap = new Map<number, any>();
  users.forEach(u => userMap.set(Number(u.id_user), u));


  for (const itr of itrData) {

    const requestorUser = userMap.get(Number(itr.requestor));
    const inspectorUser = userMap.get(Number(itr.inspection_by));

    const requestorEmail = requestorUser?.email ?? null;
    const inspectorEmail = inspectorUser?.email ?? null;

    if (!requestorEmail && !inspectorEmail) {
      console.warn(`Skip email submission ${itr.submission_id} - no recipient`);
      continue;
    }

    const legendText = this.mapLegendInspectionAuth(
      itr.legend_inspection_auth
    );

    const view_data = {
      submission_id: itr.submission_id ?? "-",
      status_invitation: itr.status_invitation ?? "-",
      legend_inspection_auth: legendText,
      system: itr.template?.system_rel?.system_name ?? "-",
      subsystem: itr.template?.subsystem_rel?.subsystem_name ?? "-",
      status: "RFI Transmittal To Client",
      inspectionDate: new Date().toLocaleString(),
    };

    const content = this.email.renderTemplate(
      "transmittal_data.ejs",
      view_data
    );

    const data_email = new sendEmailDto();
    data_email.content = content;
    data_email.subject = `[${itr.submission_id ?? "-"}] RFI Transmitted`;
    data_email.from = `"External Sender" <ilharaskyfauzan@gmail.com>`;

    data_email.email_to = requestorEmail ? [requestorEmail] : [];
    data_email.email_cc = inspectorEmail ? [inspectorEmail] : [];
    data_email.email_bcc = ["fzn.ilhrsky@gmail.com"];

    if (data_email.email_to.length === 0) {
      console.warn(`No primary recipient for submission ${itr.submission_id}`);
      continue;
    }

    // =========================
    // ADD PORTAL EMAIL LIST
    // =========================
    const portal_email = await this.email.getPortalEmailList({
      process: "Transmittal To Client",
    });

    if (portal_email?.length > 0) {
      portal_email.forEach((row) => {
        if (row.email_to) {
          const to = row.email_to
            .split(",")
            .map(v => v.trim())
            .filter(v => v);
          data_email.email_to.push(...to);
        }

        if (row.email_cc) {
          const cc = row.email_cc
            .split(",")
            .map(v => v.trim())
            .filter(v => v);
          data_email.email_cc.push(...cc);
        }

        if (row.email_bcc) {
          const bcc = row.email_bcc
            .split(",")
            .map(v => v.trim())
            .filter(v => v);
          data_email.email_bcc.push(...bcc);
        }
      });
    }

    // Remove duplicate email
    data_email.email_to = [...new Set(data_email.email_to)];
    data_email.email_cc = [...new Set(data_email.email_cc)];
    data_email.email_bcc = [...new Set(data_email.email_bcc)];

    try {
    await this.email.sendEmail(data_email);
    } catch (err) {
      console.error(`Email failed for ${itr.submission_id}:`, err);
    }
  }

  return {
    message: 'RFI Transmittal successfully',
    total_updated: dtos.length,
  };
}

private mapLegendInspectionAuth(value: any): string {
  if (!value) return "-";

  const legendMap: Record<number, string> = {
    0: "Hold Point",
    1: "Witness",
    2: "Monitoring",
    3: "Review",
  };

  const values = Array.isArray(value)
    ? value
    : String(value).split(",");

  return values
    .map(v => legendMap[Number(v.trim())] ?? `Unknown(${v})`)
    .join(", ");
}




  //------------------------- submit RFI Production ------------------------------

  async updateRfi(dto: UpdateRfiDto) {
    try {
     const decryptedRequestor = this.aesEcb.decryptBase64Url(
        String(dto.requestor)
      );

      const id_user = Number(decryptedRequestor);

      if (isNaN(id_user)) {
        throw new BadRequestException("Invalid requestor");
      }

      const templateIds = Array.isArray(dto.id_template)
        ? dto.id_template.map(Number)
        : [Number(dto.id_template)];

      if (!templateIds.length) {
        throw new BadRequestException("id_template is required");
      }

      const firstTemplate = await this.pcmsTemplateRepo.findOne({
        where: { id: templateIds[0] },
      });

      if (!firstTemplate) {
        throw new NotFoundException("Template not found");
      }

      const master = await this.ReportRepo.findOne({
        where: {
          project: firstTemplate.project_id,
          module: firstTemplate.module,
          type_of_module: firstTemplate.type_of_module,
          category: "mc_rfi",
        },
      });

      if (!master) {
        throw new BadRequestException(
          "Master report (mc_rfi) not found. Please create master report first."
        );
      }

      const prefix = master.report_no;
      const suffix = await this.generateSubmissionSuffix(prefix);
      const submissionId = `${prefix}-${suffix}`;

      const results = [];

      for (const tempId of templateIds) {
        const itr = await this.pcmsItrRepo.findOne({
          where: { id_template: tempId },
        });

        if (!itr) {
          throw new NotFoundException(
            `RFI data not found for id_template: ${tempId}`
          );
        }

        itr.submission_id = submissionId;
        itr.requestor = id_user;
        itr.date_request = new Date();
        itr.area_v2 = dto.area_v2;
        itr.location_v2 = dto.location_v2;
        itr.status_inspection = 1;

        await this.pcmsItrRepo.save(itr);
        results.push(itr);
      }

      return {
        success: true,
        message: "RFI successfully submitted",
        data: results,
      };
    } catch (error) {
      console.error("Error updateRfi:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException("Submit RFI failed");
    }
  }




  async generateSubmissionSuffix(prefix: string) {
    const lastData = await this.pcmsItrRepo.findOne({
      where: { submission_id: Like(`${prefix}-%`) },
      order: { submission_id: "DESC" },
    });

    let nextNumber = 1;

    if (lastData?.submission_id) {
      const lastNumber = parseInt(lastData.submission_id.split("-").pop(), 10);
      nextNumber = lastNumber + 1;
    }

    return String(nextNumber).padStart(6, "0");
  }



  // ------------------ Get RFI Inspection -----------------
  async getRfiInspectionList(queryDto: ServerSideDTO) {
    const { sort, search, page, size } = queryDto;
    const take = size ?? 10;
    const skip = page * take;
    const qb = this.pcmsItrRepo.createQueryBuilder("itr");
  }






  // ---------------------------------- updated Rejected RFI -----------------------------

  async submitRejected(dto: UpdateRfiDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
       const decryptedRequestor = this.aesEcb.decryptBase64Url(
        String(dto.requestor)
      );

      const id_user = Number(decryptedRequestor);

      if (isNaN(id_user)) {
        throw new BadRequestException("Invalid requestor");
      }

      const templateIds = Array.isArray(dto.id_template)
        ? dto.id_template
        : [dto.id_template];

      const results = [];

      for (const tempId of templateIds) {

        const oldItr = await queryRunner.manager.findOne(PcmsITR, {
          where: {
            id_template: Number(tempId),
            status_delete: 0,
          },
        });

        if (!oldItr) {
          throw new NotFoundException(
            `Active ITR not found for template ${tempId}`
          );
        }


        await queryRunner.manager.update(
          PcmsITR,
          { id_itr: oldItr.id_itr },
          {
            status_inspection: 0,
            status_delete: 1,
            date_created: new Date(),
            spv_inspection_datetime: new Date(),
            spv_inspection_by: id_user,
          }
        );


        const {
          id_itr,
          submission_id,
          status_delete,
          status_inspection,
          date_request,
          date_created,
          ...cleanOldItr
        } = oldItr;

        const newItr = queryRunner.manager.create(PcmsITR, {
          ...cleanOldItr,

          submission_id: null,
          resubmit_from_id: oldItr.id_itr,
          requestor: id_user,
          date_request: new Date(),
          area_v2: dto.area_v2,
          location_v2: dto.location_v2,
          status_inspection: 1,
          status_delete: 0,
          date_created: new Date(),
          spv_inspection_datetime: new Date(),
          spv_inspection_by: id_user,
        });


        const saved = await queryRunner.manager.save(newItr);

        const submissionNo = await this.generateSubmissionNumber(saved);

        await queryRunner.manager.update(
          PcmsITR,
          { id_itr: saved.id_itr },
          { submission_id: submissionNo }
        );

        results.push(saved);
      }


      await queryRunner.commitTransaction();

      return {
        success: true,
        message: "RFI rejected & resubmitted successfully",
        data: results,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error.message);
    } finally {
      await queryRunner.release();
    }
  }


  async generateSubmissionNumber(saved: any) {

    try {
      const tpl = await this.pcmsTemplateRepo.findOne({
        where: { id: Number(saved.id_template) },
      });

      if (!tpl) return null;

      const master = await this.ReportRepo.findOne({
        where: {
          project: tpl.project_id,
          discipline: tpl.discipline,
          module: tpl.module,
          type_of_module: tpl.type_of_module,
          category: "mc_rfi",
        },
      });

      const prefix = master?.report_no ?? `SUB`;
      const suffix = await this.generateSubmissionSuffix(prefix)
      return `${prefix}-${suffix}`;
    } catch (err) {
      console.error("generateSubmissionNumber error:", err);
      return null;
    }
  }



  // TESTINGS




}
