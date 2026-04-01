import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { In, Like, Repository } from "typeorm";
import { PcmsITR } from "pcms_itr/pcms_itr.entity";
import { MasterChecklist } from "master_checklist/master_checklist.entity";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AesEcbService } from "crypto/aes-ecb.service";
import { PcmsItrChecklist } from "./pcms_checklist.entity";
import { text } from "stream/consumers";
import { submitInspectionDto } from "DTO/dto.submit_inspection";
import { PortalUser } from "portal_user_db/portal_user.entity";
import { sendEmailDto } from "notifications_email/DTO/dto.send_email";
import { NotificationsEmailService } from "notifications_email/notifications_email.service";


@Injectable() 
export class PcmsItrChecklistService {
    create(data: Partial<PcmsItrChecklist>, userId: any): PcmsItrChecklist | PromiseLike<PcmsItrChecklist> {
        throw new Error('Method not implemented.');
    }


    constructor(
        @InjectRepository(PcmsItrChecklist) 
        private readonly PcmsChecklistRepo: Repository<PcmsItrChecklist>,

        @InjectRepository(PcmsITR)
        private readonly pcmsItrRepo: Repository<PcmsITR>,

        @InjectRepository(PortalUser, 'portal')
        private readonly PortalUserRepo: Repository<PortalUser>,

        // @InjectRepository(PortalUser)
        // private readonly portalUserRepo: Repository<PortalUser>,
        @InjectRepository(MasterChecklist) 
        private readonly masterChecklistRepo: Repository<MasterChecklist>,

        private readonly email: NotificationsEmailService,
        private readonly aesEcb: AesEcbService,

    ){}




    // ---------------------- SUBMIT POST PONE TO CLIENT -----------------------------
  async submitPostPone(data: Partial<submitInspectionDto>): Promise<void> {

  const { created_by, mc_rel, form_mc } = data;

  if (!created_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
  const creatorId = Number(decryptedCreator);
  if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

  const groupedForm = form_mc.reduce((acc, item) => {
    if (!acc[item.tag_number]) acc[item.tag_number] = [];
    acc[item.tag_number].push(item);
    return acc;
  }, {} as Record<string, any[]>);


  const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

  const existing = await this.PcmsChecklistRepo.find({
    where: { id_mc_itr: In(itrIds) },
  });

  const existingMap = new Map(
    existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
  );

  const savePayload: any[] = [];

  const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

  for (const itrItem of mc_rel) {

    const tag = itrItem.tag_number;
    const itrId = Number(itrItem.itr_id);
    if (!itrId) continue;

    const formItems = groupedForm[tag] ?? [];
    if (!formItems.length) continue;

    if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

    for (const item of formItems) {

      const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
      if (!formChecklist) continue;

      const resultRaw = item.result ?? "";
      const result = String(resultRaw).trim().toUpperCase();

      // update flags
      if (result === "PL") {
        itrFlags.get(itrId)!.hasPL = true;
      } else if (result !== "") {
        itrFlags.get(itrId)!.hasNonPL = true;
      }

      const key = `${itrId}-${formChecklist.id}`;
      const found = existingMap.get(key);

      if (found) {
        // --- UPDATE ---
        found.id_mc_itr = itrId;
        found.id_form_checklist = formChecklist.id;
        found.result = item.result ?? null;
        found.remarks = item.remarks ?? null;
        found.updated_by = creatorId;
        found.updated_date = new Date();

        savePayload.push(found);

      } else {
        // ------ INSERT ------
        savePayload.push({
          id_mc_itr: itrId,
          id_form_checklist: formChecklist.id,
          result: item.result ?? null,
          remarks: item.remarks ?? null,
          created_by: creatorId,
          created_date: new Date(),
        });
      }
    }
  }

  if (savePayload.length) {
    await this.PcmsChecklistRepo.save(savePayload);
  }

 
  const toReject = Array.from(itrFlags.entries())
    .filter(([_, f]) => f.hasPL)
    .map(([id]) => id);

  const toAccept = Array.from(itrFlags.entries())
    .filter(([_, f]) => !f.hasPL && f.hasNonPL)
    .map(([id]) => id);

  if (toReject.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 7 })
      .where('id_itr IN (:...ids)', { ids: toReject })
      .execute();
  }

  if (toAccept.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 6 })
      .where('id_itr IN (:...ids)', { ids: toAccept })
      .execute();
  }

}



 // ---------------------- SUBMIT APPROVE WITH COMMENT TO CLIENT ------------------------
    async submitApproveComment(data: Partial<submitInspectionDto>): Promise<void> {

  const { created_by, mc_rel, form_mc } = data;

  if (!created_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
  const creatorId = Number(decryptedCreator);
  if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

  const groupedForm = form_mc.reduce((acc, item) => {
    if (!acc[item.tag_number]) acc[item.tag_number] = [];
    acc[item.tag_number].push(item);
    return acc;
  }, {} as Record<string, any[]>);


  const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

  const existing = await this.PcmsChecklistRepo.find({
    where: { id_mc_itr: In(itrIds) },
  });

  const existingMap = new Map(
    existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
  );

  const savePayload: any[] = [];

  const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

  for (const itrItem of mc_rel) {

    const tag = itrItem.tag_number;
    const itrId = Number(itrItem.itr_id);
    if (!itrId) continue;

    const formItems = groupedForm[tag] ?? [];
    if (!formItems.length) continue;

    if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

    for (const item of formItems) {

      const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
      if (!formChecklist) continue;

      const resultRaw = item.result ?? "";
      const result = String(resultRaw).trim().toUpperCase();

      // update flags
      if (result === "PL") {
        itrFlags.get(itrId)!.hasPL = true;
      } else if (result !== "") {
        itrFlags.get(itrId)!.hasNonPL = true;
      }

      const key = `${itrId}-${formChecklist.id}`;
      const found = existingMap.get(key);

      if (found) {
        // --- UPDATE ---
        found.id_mc_itr = itrId;
        found.id_form_checklist = formChecklist.id;
        found.result = item.result ?? null;
        found.remarks = item.remarks ?? null;
        found.updated_by = creatorId;
        found.updated_date = new Date();

        savePayload.push(found);

      } else {
        // ------ INSERT ------
        savePayload.push({
          id_mc_itr: itrId,
          id_form_checklist: formChecklist.id,
          result: item.result ?? null,
          remarks: item.remarks ?? null,
          created_by: creatorId,
          created_date: new Date(),
        });
      }
    }
  }

  if (savePayload.length) {
    await this.PcmsChecklistRepo.save(savePayload);
  }

 
  const toReject = Array.from(itrFlags.entries())
    .filter(([_, f]) => f.hasPL)
    .map(([id]) => id);

  const toAccept = Array.from(itrFlags.entries())
    .filter(([_, f]) => !f.hasPL && f.hasNonPL)
    .map(([id]) => id);

  if (toReject.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 7 })
      .where('id_itr IN (:...ids)', { ids: toReject })
      .execute();
  }

  if (toAccept.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 6 })
      .where('id_itr IN (:...ids)', { ids: toAccept })
      .execute();
  }

}



    // ----------------------- SUBMIT RE OFFER TO CLIENT --------------------------------------
  async submitReOffer(data: Partial<submitInspectionDto>): Promise<void> {

  const { created_by, mc_rel, form_mc } = data;

  if (!created_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
  const creatorId = Number(decryptedCreator);
  if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

  const groupedForm = form_mc.reduce((acc, item) => {
    if (!acc[item.tag_number]) acc[item.tag_number] = [];
    acc[item.tag_number].push(item);
    return acc;
  }, {} as Record<string, any[]>);


  const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

  const existing = await this.PcmsChecklistRepo.find({
    where: { id_mc_itr: In(itrIds) },
  });

  const existingMap = new Map(
    existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
  );

  const savePayload: any[] = [];

  const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

  for (const itrItem of mc_rel) {

    const tag = itrItem.tag_number;
    const itrId = Number(itrItem.itr_id);
    if (!itrId) continue;

    const formItems = groupedForm[tag] ?? [];
    if (!formItems.length) continue;

    if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

    for (const item of formItems) {

      const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
      if (!formChecklist) continue;

      const resultRaw = item.result ?? "";
      const result = String(resultRaw).trim().toUpperCase();

      // update flags
      if (result === "PL") {
        itrFlags.get(itrId)!.hasPL = true;
      } else if (result !== "") {
        itrFlags.get(itrId)!.hasNonPL = true;
      }

      const key = `${itrId}-${formChecklist.id}`;
      const found = existingMap.get(key);

      if (found) {
        // --- UPDATE ---
        found.id_mc_itr = itrId;
        found.id_form_checklist = formChecklist.id;
        found.result = item.result ?? null;
        found.remarks = item.remarks ?? null;
        found.updated_by = creatorId;
        found.updated_date = new Date();

        savePayload.push(found);

      } else {
        // ------ INSERT ------
        savePayload.push({
          id_mc_itr: itrId,
          id_form_checklist: formChecklist.id,
          result: item.result ?? null,
          remarks: item.remarks ?? null,
          created_by: creatorId,
          created_date: new Date(),
        });
      }
    }
  }

  if (savePayload.length) {
    await this.PcmsChecklistRepo.save(savePayload);
  }

 
  const toReject = Array.from(itrFlags.entries())
    .filter(([_, f]) => f.hasPL)
    .map(([id]) => id);

  const toAccept = Array.from(itrFlags.entries())
    .filter(([_, f]) => !f.hasPL && f.hasNonPL)
    .map(([id]) => id);

  if (toReject.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 7 })
      .where('id_itr IN (:...ids)', { ids: toReject })
      .execute();
  }

  if (toAccept.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 6 })
      .where('id_itr IN (:...ids)', { ids: toAccept })
      .execute();
  }

}


  
    // ----------------------- Submit Inspection RFI ( SUPERVISOR ) ------------------------------- 
    
async submitInspection(data: Partial<submitInspectionDto>): Promise<void> {

  const { created_by, mc_rel, form_mc } = data;

  if (!created_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  // =========================
  // DECRYPT USER
  // =========================
  const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
  const creatorId = parseInt(decryptedCreator, 10);

  if (isNaN(creatorId)) {
    throw new BadRequestException("Invalid created_by");
  }

  // =========================
  // GROUP FORM BY TAG
  // =========================
  const groupedForm = form_mc.reduce((acc, item) => {
    if (!acc[item.tag_number]) acc[item.tag_number] = [];
    acc[item.tag_number].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

  const existing = await this.PcmsChecklistRepo.find({
    where: { id_mc_itr: In(itrIds) },
  });

  const existingMap = new Map(
    existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
  );

  const savePayload: any[] = [];
  const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

  // =========================
  // PROCESS CHECKLIST
  // =========================
  for (const itrItem of mc_rel) {

    const tag = itrItem.tag_number;
    const itrId = Number(itrItem.itr_id);
    if (!itrId) continue;

    const formItems = groupedForm[tag] ?? [];
    if (!formItems.length) continue;

    if (!itrFlags.has(itrId)) {
      itrFlags.set(itrId, { hasPL: false, hasNonPL: false });
    }

    for (const item of formItems) {

      const result = String(item.result ?? "").trim().toUpperCase();

      if (result === "PL") {
        itrFlags.get(itrId)!.hasPL = true;
      } else if (result !== "") {
        itrFlags.get(itrId)!.hasNonPL = true;
      }

      const key = `${itrId}-${item.id}`;
      const found = existingMap.get(key);

      if (found) {
        found.result = item.result ?? null;
        found.remarks = item.remarks ?? null;
        found.updated_by = creatorId;
        found.updated_date = new Date();
        savePayload.push(found);
      } else {
        savePayload.push({
          id_mc_itr: itrId,
          id_form_checklist: item.id,
          result: item.result ?? null,
          remarks: item.remarks ?? null,
          created_by: creatorId,
          created_date: new Date(),
        });
      }
    }
  }

  if (savePayload.length) {
    await this.PcmsChecklistRepo.save(savePayload);
  }

  // =========================
  // DETERMINE STATUS
  // =========================
  const toReject = Array.from(itrFlags.entries())
    .filter(([_, f]) => f.hasPL)
    .map(([id]) => id);

  const toAccept = Array.from(itrFlags.entries())
    .filter(([_, f]) => !f.hasPL && f.hasNonPL)
    .map(([id]) => id);

  if (toReject.length) {
    await this.pcmsItrRepo.update(
      { id_itr: In(toReject) },
      { status_inspection: 2 }
    );
  }

  if (toAccept.length) {
    await this.pcmsItrRepo.update(
      { id_itr: In(toAccept) },
      { status_inspection: 3 }
    );
  }

  // =========================
  // EMAIL NOTIFICATION
  // =========================
  const affectedItrIds = [...toReject, ...toAccept];
  if (!affectedItrIds.length) return;

  const itrData = await this.pcmsItrRepo.find({
    where: { id_itr: In(affectedItrIds) },
    relations: [
      'template',
      'template.discipline_tag',
      'template.system_rel',
      'template.subsystem_rel'
    ],
  });

  // ambil user sekali
  const userIds = new Set<number>();
  itrData.forEach(itr => {
    if (itr.requestor) userIds.add(Number(itr.requestor));
    if (itr.inspection_by) userIds.add(Number(itr.inspection_by));
  });

  const users = await this.PortalUserRepo.find({
    where: { id_user: In(Array.from(userIds)) }
  });

  const userMap = new Map(users.map(u => [u.id_user, u]));

  // ambil portal email sekali
  const portal_email = await this.email.getPortalEmailList({
    process: "Approval_by_spv",
  });

  const cleanEmails = (arr: string[]) =>
    [...new Set(arr.filter(e => e && e.includes("@")))];

  // =========================
  // SEND EMAIL
  // =========================
  for (const itr of itrData) {

    const isRejected = toReject.includes(itr.id_itr);
    const statusLabel = isRejected ? "Rejected data" : "Inspection To Qc";

    const requestorUser = userMap.get(Number(itr.requestor));
    const inspectorUser = userMap.get(Number(itr.inspection_by));

    const view_data = {
      submission_id: itr.submission_id ?? "-",
      tagNumber: itr.template?.tag_number ?? "-",
      system: itr.template?.system_rel?.system_name ?? "-",
      subsystem: itr.template?.subsystem_rel?.subsystem_name ?? "-",
      status: statusLabel,
      inspectionDate: new Date().toLocaleString(),
    };

    let content = "";
    try {
      content = this.email.renderTemplate(
        "pending_approval.ejs",
        view_data
      );
    } catch (err) {
      console.error("Template error:", err);
      continue;
    }

    const data_email = new sendEmailDto();
    data_email.subject = `MC Inspection - ${statusLabel}`;
    data_email.content = content;
    data_email.from = `"RFI System" <${process.env.MAIL_USER}>`;

    if (isRejected) {
      data_email.email_to = [requestorUser?.email];
      data_email.email_cc = [inspectorUser?.email];
    } else {
      data_email.email_to = [inspectorUser?.email];
      data_email.email_cc = [requestorUser?.email];
    }

    data_email.email_bcc = ["fzn.ilhrsky@gmail.com"];

    // tambah portal email
    if (portal_email?.length > 0) {
      portal_email.forEach(row => {
        if (row.email_to) data_email.email_to.push(...row.email_to.split(","));
        if (row.email_cc) data_email.email_cc.push(...row.email_cc.split(","));
        if (row.email_bcc) data_email.email_bcc.push(...row.email_bcc.split(","));
      });
    }

    // clean
    data_email.email_to = cleanEmails(data_email.email_to);
    data_email.email_cc = cleanEmails(data_email.email_cc);
    data_email.email_bcc = cleanEmails(data_email.email_bcc);

    if (!data_email.email_to.length) {
      console.warn(`No recipient for ${itr.submission_id}`);
      continue;
    }

    try {
      await this.email.sendEmail(data_email);
      console.log(`Email sent: ${itr.submission_id}`);
    } catch (err) {
      console.error(`Email failed: ${itr.submission_id}`, err);
    }
  }
}




// ------------------------- SUBMIT CHECKLIST DATA BY QC ( Quality Control ) -------------------------

async submitPendingQc(data: Partial<submitInspectionDto>): Promise<void> {

  const { created_by, mc_rel, form_mc } = data;

  if (!created_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
  const creatorId = parseInt(decryptedCreator, 10);
  if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

  const groupedForm = form_mc.reduce((acc, item) => {
    if (!acc[item.tag_number]) acc[item.tag_number] = [];
    acc[item.tag_number].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

  const existing = await this.PcmsChecklistRepo.find({
    where: { id_mc_itr: In(itrIds) },
  });

  const existingMap = new Map(
    existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
  );

  const savePayload: any[] = [];

  const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

  for (const itrItem of mc_rel) {

    const tag = itrItem.tag_number;
    const itrId = Number(itrItem.itr_id);
    if (!itrId) continue;

    const formItems = groupedForm[tag] ?? [];
    if (!formItems.length) continue;

    if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

    for (const item of formItems) {

      const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
      if (!formChecklist) continue;

      const resultRaw = item.result ?? "";
      const result = String(resultRaw).trim().toUpperCase();

      // update flags
      if (result === "PL") {
        itrFlags.get(itrId)!.hasPL = true;
      } else if (result !== "") {
        itrFlags.get(itrId)!.hasNonPL = true;
      }

      const key = `${itrId}-${formChecklist.id}`;
      const found = existingMap.get(key);

      if (found) {
        // --- UPDATE ---
        found.id_mc_itr = itrId;
        found.id_form_checklist = formChecklist.id;
        found.result = item.result ?? null;
        found.remarks = item.remarks ?? null;
        found.updated_by = creatorId;
        found.updated_date = new Date();

        savePayload.push(found);

      } else {
        // ------ INSERT ------
        savePayload.push({
          id_mc_itr: itrId,
          id_form_checklist: formChecklist.id,
          result: item.result ?? null,
          remarks: item.remarks ?? null,
          created_by: creatorId,
          created_date: new Date(),
        });
      }
    }
  }

  if (savePayload.length) {
    await this.PcmsChecklistRepo.save(savePayload);
  }

 
  const toReject = Array.from(itrFlags.entries())
    .filter(([_, f]) => f.hasPL)
    .map(([id]) => id);

  const toAccept = Array.from(itrFlags.entries())
    .filter(([_, f]) => !f.hasPL && f.hasNonPL)
    .map(([id]) => id);

  
  if (toReject.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 4 })
      .where('id_itr IN (:...ids)', { ids: toReject })
      .execute();
  }

  if (toAccept.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 5 })
      .where('id_itr IN (:...ids)', { ids: toAccept })
      .execute();
  }

}



// ------------------------ SUBMIT CHECKLIST DATA BY CLIENT ------------------------------

async submitPendingClient(data: Partial<submitInspectionDto>): Promise<void> {

  const { created_by, mc_rel, form_mc } = data;

  if (!created_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
  const creatorId = Number(decryptedCreator);
  if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

  const groupedForm = form_mc.reduce((acc, item) => {
    if (!acc[item.tag_number]) acc[item.tag_number] = [];
    acc[item.tag_number].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

  const existing = await this.PcmsChecklistRepo.find({
    where: { id_mc_itr: In(itrIds) },
  });

  const existingMap = new Map(
    existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
  );

  const savePayload: any[] = [];

  const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

  for (const itrItem of mc_rel) {

    const tag = itrItem.tag_number;
    const itrId = Number(itrItem.itr_id);
    if (!itrId) continue;

    const formItems = groupedForm[tag] ?? [];
    if (!formItems.length) continue;

    if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

    for (const item of formItems) {

      const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
      if (!formChecklist) continue;

      const resultRaw = item.result ?? "";
      const result = String(resultRaw).trim().toUpperCase();

      // update flags
      if (result === "PL") {
        itrFlags.get(itrId)!.hasPL = true;
      } else if (result !== "") {
        itrFlags.get(itrId)!.hasNonPL = true;
      }

      const key = `${itrId}-${formChecklist.id}`;
      const found = existingMap.get(key);

      if (found) {
        // --- UPDATE ---
        found.id_mc_itr = itrId;
        found.id_form_checklist = formChecklist.id;
        found.result = item.result ?? null;
        found.remarks = item.remarks ?? null;
        found.updated_by = creatorId;
        found.updated_date = new Date();

        savePayload.push(found);

      } else {
        // ------ INSERT ------
        savePayload.push({
          id_mc_itr: itrId,
          id_form_checklist: formChecklist.id,
          result: item.result ?? null,
          remarks: item.remarks ?? null,
          created_by: creatorId,
          created_date: new Date(),
        });
      }
    }
  }

  if (savePayload.length) {
    await this.PcmsChecklistRepo.save(savePayload);
  }

  
 
  const toReject = Array.from(itrFlags.entries())
    .filter(([_, f]) => f.hasPL)
    .map(([id]) => id);

  const toAccept = Array.from(itrFlags.entries())
    .filter(([_, f]) => !f.hasPL && f.hasNonPL)
    .map(([id]) => id);

  
  if (toReject.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 7 })
      .where('id_itr IN (:...ids)', { ids: toReject })
      .execute();
  }

  if (toAccept.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 8 })
      .where('id_itr IN (:...ids)', { ids: toAccept })
      .execute();
  }

}



// ------------------------ APPROVE CHECKLIST DATA BY CLIENT ------------------------------
async approveClient(data: Partial<submitInspectionDto>): Promise<void> {

  const { created_by, mc_rel, form_mc } = data;

    if (!created_by || !mc_rel?.length || !form_mc?.length) {
      throw new BadRequestException("Missing required fields");
    }

    const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
    const creatorId = Number(decryptedCreator);
    if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

    const groupedForm = form_mc.reduce((acc, item) => {
      if (!acc[item.tag_number]) acc[item.tag_number] = [];
      acc[item.tag_number].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

    const existing = await this.PcmsChecklistRepo.find({
      where: { id_mc_itr: In(itrIds) },
    });

    const existingMap = new Map(
      existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
    );

    const savePayload: any[] = [];

    const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

    for (const itrItem of mc_rel) {

      const tag = itrItem.tag_number;
      const itrId = Number(itrItem.itr_id);
      if (!itrId) continue;

      const formItems = groupedForm[tag] ?? [];
      if (!formItems.length) continue;

      if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

      for (const item of formItems) {

        const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
        if (!formChecklist) continue;

        const resultRaw = item.result ?? "";
        const result = String(resultRaw).trim().toUpperCase();

        // update flags
        if (result === "PL") {
          itrFlags.get(itrId)!.hasPL = true;
        } else if (result !== "") {
          itrFlags.get(itrId)!.hasNonPL = true;
        }

        const key = `${itrId}-${formChecklist.id}`;
        const found = existingMap.get(key);

        if (found) {
          // --- UPDATE ---
          found.id_mc_itr = itrId;
          found.id_form_checklist = formChecklist.id;
          found.result = item.result ?? null;
          found.remarks = item.remarks ?? null;
          found.updated_by = creatorId;
          found.updated_date = new Date();

          savePayload.push(found);

        } else {
          // ------ INSERT ------
          savePayload.push({
            id_mc_itr: itrId,
            id_form_checklist: formChecklist.id,
            result: item.result ?? null,
            remarks: item.remarks ?? null,
            created_by: creatorId,
            created_date: new Date(),
          });
        }
      }
    }

    if (savePayload.length) {
      await this.PcmsChecklistRepo.save(savePayload);
    }

    

    const toAccept = Array.from(itrFlags.entries())
      .filter(([_, f]) => !f.hasPL && f.hasNonPL)
      .map(([id]) => id);

  

    if (toAccept.length) {
      await this.pcmsItrRepo
        .createQueryBuilder()
        .update()
        .set({ status_inspection: 11 })
        .where('id_itr IN (:...ids)', { ids: toAccept })
        .execute();
    }


}


// ------------------------ POSTPONE CHECKLIST DATA BY CLIENT ------------------------------
async postPoneClient(data: Partial<submitInspectionDto>): Promise<void> {
  const { created_by, mc_rel, form_mc } = data;

  if (!created_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
  const creatorId = Number(decryptedCreator);
  if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

  const groupedForm = form_mc.reduce((acc, item) => {
    if (!acc[item.tag_number]) acc[item.tag_number] = [];
    acc[item.tag_number].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

  const existing = await this.PcmsChecklistRepo.find({
    where: { id_mc_itr: In(itrIds) },
  });

  const existingMap = new Map(
    existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
  );

  const savePayload: any[] = [];

  const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

  for (const itrItem of mc_rel) {

    const tag = itrItem.tag_number;
    const itrId = Number(itrItem.itr_id);
    if (!itrId) continue;

    const formItems = groupedForm[tag] ?? [];
    if (!formItems.length) continue;

    if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

    for (const item of formItems) {

      const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
      if (!formChecklist) continue;

      const resultRaw = item.result ?? "";
      const result = String(resultRaw).trim().toUpperCase();

      // update flags
      if (result === "PL") {
        itrFlags.get(itrId)!.hasPL = true;
      } else if (result !== "") {
        itrFlags.get(itrId)!.hasNonPL = true;
      }

      const key = `${itrId}-${formChecklist.id}`;
      const found = existingMap.get(key);

      if (found) {
        // --- UPDATE ---
        found.id_mc_itr = itrId;
        found.id_form_checklist = formChecklist.id;
        found.result = item.result ?? null;
        found.remarks = item.remarks ?? null;
        found.updated_by = creatorId;
        found.updated_date = new Date();

        savePayload.push(found);

      } else {
        // ------ INSERT ------
        savePayload.push({
          id_mc_itr: itrId,
          id_form_checklist: formChecklist.id,
          result: item.result ?? null,
          remarks: item.remarks ?? null,
          created_by: creatorId,
          created_date: new Date(),
        });
      }
    }
  }

  if (savePayload.length) {
    await this.PcmsChecklistRepo.save(savePayload);
  }


  const toAccept = Array.from(itrFlags.entries())
    .filter(([_, f]) => !f.hasPL && f.hasNonPL)
    .map(([id]) => id);



  if (toAccept.length) {
    await this.pcmsItrRepo
      .createQueryBuilder()
      .update()
      .set({ status_inspection: 10 })
      .where('id_itr IN (:...ids)', { ids: toAccept })
      .execute();
  }
}


// ------------------------ REOFFER CHECKLIST DATA BY CLIENT ------------------------------
 async reOfferClient(data: Partial<submitInspectionDto>): Promise<void> {
    const { created_by, mc_rel, form_mc } = data;

    if (!created_by || !mc_rel?.length || !form_mc?.length) {
      throw new BadRequestException("Missing required fields");
    }

    const decryptedCreator = this.aesEcb.decryptBase64Url(String(created_by));
    const creatorId = Number(decryptedCreator);
    if (isNaN(creatorId)) throw new BadRequestException("Invalid created_by");

    const groupedForm = form_mc.reduce((acc, item) => {
      if (!acc[item.tag_number]) acc[item.tag_number] = [];
      acc[item.tag_number].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    const itrIds = mc_rel.map(x => Number(x.itr_id)).filter(Boolean);

    const existing = await this.PcmsChecklistRepo.find({
      where: { id_mc_itr: In(itrIds) },
    });

    const existingMap = new Map(
      existing.map(e => [`${e.id_mc_itr}-${e.id_form_checklist}`, e])
    );

    const savePayload: any[] = [];

    const itrFlags = new Map<number, { hasPL: boolean; hasNonPL: boolean }>();

    for (const itrItem of mc_rel) {

      const tag = itrItem.tag_number;
      const itrId = Number(itrItem.itr_id);
      if (!itrId) continue;

      const formItems = groupedForm[tag] ?? [];
      if (!formItems.length) continue;

      if (!itrFlags.has(itrId)) itrFlags.set(itrId, { hasPL: false, hasNonPL: false });

      for (const item of formItems) {

        const formChecklist = await this.masterChecklistRepo.findOne({ where: { id: item.id }});
        if (!formChecklist) continue;

        const resultRaw = item.result ?? "";
        const result = String(resultRaw).trim().toUpperCase();

        // update flags: treat any non-empty result (including PL) as accept for re-offer
        if (result !== "") {
          itrFlags.get(itrId)!.hasNonPL = true;
        }

        const key = `${itrId}-${formChecklist.id}`;
        const found = existingMap.get(key);

        if (found) {
          // --- UPDATE ---
          found.id_mc_itr = itrId;
          found.id_form_checklist = formChecklist.id;
          found.result = item.result ?? null;
          found.remarks = item.remarks ?? null;
          found.updated_by = creatorId;
          found.updated_date = new Date();

          savePayload.push(found);

        } else {
          // ------ INSERT ------
          savePayload.push({
            id_mc_itr: itrId,
            id_form_checklist: formChecklist.id,
            result: item.result ?? null,
            remarks: item.remarks ?? null,
            created_by: creatorId,
            created_date: new Date(),
          });
        }
      }
    }

    if (savePayload.length) {
      await this.PcmsChecklistRepo.save(savePayload);
    }

    const toAccept = Array.from(itrFlags.entries())
      .filter(([_, f]) => !f.hasPL && f.hasNonPL)
      .map(([id]) => id);

    if (toAccept.length) {
      await this.pcmsItrRepo
        .createQueryBuilder()
        .update()
        .set({ status_inspection: 9 })
        .where('id_itr IN (:...ids)', { ids: toAccept })
        .execute();
    }
  }



// ------------------------- UPDATE CHECKLIST ------------------------------------

async updateChecklist(data: Partial<submitInspectionDto>): Promise<void> {
  const { updated_by, mc_rel, form_mc } = data;

  if (!updated_by || !mc_rel?.length || !form_mc?.length) {
    throw new BadRequestException("Missing required fields");
  }

  // decrypt updated_by
  const decryptedUpdater = this.aesEcb.decryptBase64Url(String(updated_by));
  const decryptedUpdaterId = parseInt(decryptedUpdater, 10);

  if (isNaN(decryptedUpdaterId)) {
    throw new BadRequestException("Invalid updated_by");
  }
 
  for (const itrItem of mc_rel) {
    const itrId = itrItem.itr_id;

    const itr = await this.pcmsItrRepo.findOne({
      where: { id_itr: itrId },
    });

    if (!itr) continue;

  
    for (const form of form_mc) {

   
      const existingRow = await this.PcmsChecklistRepo.findOne({
        where: {
          id_mc_itr: itr.id_itr,
          id_form_checklist: form.id, // form checklist id
        },
      });

   
      if (existingRow) {
        existingRow.result = form.result ?? null;
        existingRow.remarks = form.remarks ?? null;
        existingRow.updated_by = decryptedUpdaterId;
        existingRow.updated_date = new Date();

        await this.PcmsChecklistRepo.save(existingRow);
        continue;
      }

      const newRow = this.PcmsChecklistRepo.create({
        id_mc_itr: itr.id_itr,
        id_form_checklist: form.id,
        result: form.result ?? null,
        remarks: form.remarks ?? null,
        created_by: decryptedUpdaterId,
        created_date: new Date(),
      });

      await this.PcmsChecklistRepo.save(newRow);
    }
  }
}


}

