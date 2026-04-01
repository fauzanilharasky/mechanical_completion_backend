import { Subsystem } from './../master_subsystem/subsystem.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike, In } from "typeorm";
import { MasterDiscipline } from "master_discipline/master_discipline.entity";
import { PcmsMcTemplate } from "./pcms_template.entity";
import { AesEcbService } from "crypto/aes-ecb.service";
import { ServerSideDTO } from "DTO/dto.serverside";
import { MasterTypeModule } from "master_typemodule/master_typemodule.entity";
import { PortalProject } from "portal_project/portal_project.entity";
import { MasterModule } from "master_module/master_module.entity";
import { PortalCompany } from "portal_company/portal_company.entity";
import { PortalUser } from "portal_user_db/portal_user.entity";
import { PcmsITR } from "pcms_itr/pcms_itr.entity";
import { MasterReportNo } from 'master_report_no/master_report.entity';
import { MasterSystem } from 'master_system/master_system.entity';
import * as ExcelJS from 'exceljs';
import { GenerateExcelDto } from 'DTO/dto.generate_excel';
import { ExportService } from 'export_excel/export_excel.services';
import { FitupExcelDto } from 'DTO/dto.fitup_excel';
import { request } from 'http';


@Injectable()
export class PcmsTemplateService {
  [x: string]: any;


  constructor(


    @InjectRepository(PcmsMcTemplate)
    private readonly pcmsTemplateRepo: Repository<PcmsMcTemplate>,

    @InjectRepository(PortalUser, 'portal')
    private readonly portalUserRepo: Repository<PortalUser>,

    @InjectRepository(PcmsITR)
    private readonly pcmsItrRepo: Repository<PcmsITR>,

    @InjectRepository(MasterDiscipline)
    private readonly MasterDisciplineRepo: Repository<MasterDiscipline>,

    @InjectRepository(Subsystem)
    private readonly subsystemRepo: Repository<Subsystem>,

    @InjectRepository(MasterTypeModule)
    private readonly typeModuleRepo: Repository<MasterTypeModule>,

    @InjectRepository(MasterReportNo)
    private readonly ReportNo: Repository<MasterReportNo>,

    @InjectRepository(MasterModule)
    private readonly masterModuleRepo: Repository<MasterModule>,




    @InjectRepository(PortalCompany, "portal")
    private readonly _Portal_Company: Repository<PortalCompany>,

    @InjectRepository(PortalProject, "portal")
    private readonly _project: Repository<PortalProject>,
    private readonly exportService: ExportService,
    private readonly aesEcb: AesEcbService
  ) { }





  // ----------------- INSPECTION RFI LIST SUPERVISOR ---------------------

  async inspectionRFI(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page, size } = queryDto;
      const take = size ?? 10;
      const skip = page * take;

      // console.log(page, size, skip)

      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .innerJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .innerJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .innerJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .innerJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .innerJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 1")
        .distinctOn(["itr.submission_id"])
        .orderBy("itr.submission_id", "DESC")
        .addOrderBy("itr.id_itr", "DESC");

      // const qb = this.pcmsItrRepo
      // .createQueryBuilder("itr")
      // .leftJoinAndSelect("itr.template", "pcmstemplate")
      // .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
      // .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
      // .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
      // .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
      // .where("pcmstemplate.assignment_status = 1")
      // .andWhere("itr.status_inspection = 1")
      // .andWhere("itr.submission_id IS NOT NULL")
      // .distinctOn(["itr.submission_id"])
      // .orderBy("itr.submission_id", "DESC")


      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        cert_id: "cert_rel.cert_id",
        event_id: "pcmstemplate.event_id",
        subsystem: "subsystem_rel.subsystem_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        production_assigned_to: "itr.production_assigned_to",
        requestor: "itr.requestor",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

      // SEARCHING
      if (search) {
        const filters = JSON.parse(search);

        Object.keys(filters).forEach((key) => {
          const column = columnMap[key];
          if (!column) return;

          qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
            [key]: `%${filters[key]}%`,
          });
        });
      }

      qb.skip(skip).take(take);
      // SORTING
      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col] || `pcmstemplate.${col}`;
        qb.addOrderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }



      const data = await qb.getMany();

      const totalQb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoin("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 1")
        .select("COUNT(DISTINCT itr.submission_id)", "count");


      const totalResult = await totalQb.getRawOne();
      const total = Number(totalResult.count || 0);

      const projectIds = [...new Set(data.map((d) => d.project_id))];
      const companyIds = [...new Set(data.map((d) => d.company_id))];

      const projects = await this._project.findBy({
        id: In(projectIds),
      });

      const companies = await this._Portal_Company.findBy({
        id_company: In(companyIds),
      });

      const projectMap = Object.fromEntries(
        projects.map((p) => [p.id, p.project_name])
      );

      const companyMap = Object.fromEntries(
        companies.map((c) => [c.id_company, c.company_name])
      );

      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);

      const userIds = [
        ...new Set(
          itrList
            .map((it: any) => Number(it?.requestor))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalUsers = userIds.length
        ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr || [];
        const itr =
          Array.isArray(itrArr) && itrArr.length
            ? itrArr
              .slice()
              .sort(
                (a: any, b: any) =>
                  (b.id_itr || 0) - (a.id_itr || 0)
              )[0]
            : {};

        return {
          ...v,
          submission_id: itr.submission_id ?? null,
          date_request: itr.date_request ?? null,
          report_resubmit_status: itr.report_resubmit_status ?? null,
          status_inspection: itr.status_inspection ?? null,
          requestor_name: userMap[itr.requestor] ?? "Not Set",
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
        };
      });
      return {

        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) {  if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }






  // ------------------ PENDING APPROVAL QC --------------------(proccess)

  // ...existing code...
  async pendingReview(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 1, size = 10, status_inspection } = queryDto;
      const pageNum = Number(page) || 1;
      const take = Number(size) || 10;
      const skip = (pageNum - 1) * take;

      const statuses = status_inspection
        ? Array.isArray(status_inspection) ? status_inspection.map(Number) : [Number(status_inspection)]
        : [9, 10, 11];

      // console.log(queryDto);

      const itrQb = this.pcmsItrRepo
        .createQueryBuilder('itr')
        // .leftJoin("itr.pcmstemplate", "template")
        // .leftJoin("template.discipline_tag", "discipline")
        // .leftJoin("template.typeModule", "typeModule")
        // .leftJoin("template.templates_md", "templates_md")
        // .leftJoin("pcmstemplate.subsystem_rel", "subsystem_rel")
        .select([
          'itr.submission_id AS submission_id',
          'itr.id_itr AS id_itr',
          'itr.id_template AS id_template',
          'itr.date_request AS date_request',
          'itr.requestor AS requestor',
          'itr.production_assigned_to AS production_assigned_to',
          'itr.status_inspection AS status_inspection',
          'itr.report_resubmit_status AS report_resubmit_status',
        ])
        .where('itr.submission_id IS NOT NULL AND trim(itr.submission_id) <> \'\'')
        .andWhere('itr.status_inspection IN (:...sts)', { sts: statuses })
        .orderBy('itr.submission_id', 'DESC')
        .addOrderBy('itr.id_itr', 'DESC')
        .distinctOn(['itr.submission_id'])
        .skip(skip)
        .take(take);

        const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        date_request: "itr.date_request",
        production_assigned_to: "itr.production_assigned_to",
        requestor: "itr.requestor",
        requestor_name: "requestor.full_name", 
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

      


      // simple search handling (submission_id or requestor)
       if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            itrQb.andWhere("1 = 0"); // force empty result
          } else {
            itrQb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            itrQb.andWhere("1 = 0");
          } else {
            itrQb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        if (key === "project_id") {
          itrQb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        itrQb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }


      // sorting: allow sort by submission_id or status_inspection or requestor
      if (sort) {
        const [col, dir] = String(sort).split(',');
        const direction = (dir || 'DESC').toUpperCase() as 'ASC' | 'DESC';
        if (col === 'submission_id') itrQb.orderBy('itr.submission_id', direction);
        else if (col === 'status_inspection') itrQb.addOrderBy('itr.status_inspection', direction);
        else if (col === 'requestor') itrQb.addOrderBy('itr.requestor', direction);
        
      }

      const itrRows = await itrQb.getRawMany();

      // total distinct submission count for statuses
      const totalRaw = await this.pcmsItrRepo
        .createQueryBuilder('itr')
        .select('COUNT(DISTINCT itr.submission_id)', 'count')
        .where('itr.submission_id IS NOT NULL AND trim(itr.submission_id) <> \'\'')
        .andWhere('itr.status_inspection IN (:...sts)', { sts: statuses })
        .getRawOne();
      const total = Number(totalRaw?.count ?? 0);

      if (!itrRows || itrRows.length === 0) {
        return {
          data: [],
          total,
          page: pageNum,
          limit: take,
          total_pages: Math.ceil(total / take),
        };
      }


      // fetch related templates, projects, companies and users
      const templateIds = [...new Set(itrRows.map((r: any) => Number(r.id_template)).filter(Boolean))];
      const templates = templateIds.length
        ? await this.pcmsTemplateRepo.find({
          where: { id: In(templateIds) },
          relations: {
            discipline_tag: true,
            templates_md: true,
            typeModule: true,
          },
        })
        : [];
      const templateMap = Object.fromEntries(templates.map((t: any) => [t.id, t]));

      const projectIds = [...new Set(templates.map((t: any) => t.project_id).filter(Boolean))];
      const companyIds = [...new Set(templates.map((t: any) => t.company_id).filter(Boolean))];
      const userIds = [
        ...new Set(
          itrRows.flatMap((r: any) => [Number(r.requestor), Number(r.production_assigned_to)]).filter((v) => v && !Number.isNaN(v))
        ),
      ];

      const [projects, companies, portalUsers] = await Promise.all([
        projectIds.length ? this._project.findBy({ id: In(projectIds) }) : [],
        companyIds.length ? this._Portal_Company.findBy({ id_company: In(companyIds) }) : [],
        userIds.length ? this.portalUserRepo.findBy({ id_user: In(userIds) }) : [],
      ]);

      const projectMap = Object.fromEntries(projects.map((p: any) => [p.id, p.project_name]));
      const companyMap = Object.fromEntries(companies.map((c: any) => [c.id_company, c.company_name]));
      const userMap = Object.fromEntries(portalUsers.map((u: any) => [u.id_user, u.full_name ?? u.fullname ?? '']));

      // build final rows preserving itrRows order (no duplicates)
      const result = itrRows.map((r: any) => {
        const tpl = templateMap[Number(r.id_template)] ?? null;
        return {
          submission_id: r.submission_id,
          id_itr: Number(r.id_itr),
          date_request: r.date_request ?? null,
          report_resubmit_status: r.report_resubmit_status ?? null,
          status_inspection: r.status_inspection ?? null,
          requestor: Number(r.requestor) || null,
          requestor_name: userMap[Number(r.requestor)] ?? 'Not Set',
          production_assigned_to: Number(r.production_assigned_to) || null,
          production_assigned_to_name: userMap[Number(r.production_assigned_to)] ?? 'Not Set',
          template_id: tpl?.id ?? null,
          drawing_no: tpl?.drawing_no ?? null,
          discipline_tag: tpl?.discipline_tag ?? null,
          templates_md: tpl?.templates_md ?? null,
          typeModule: tpl?.typeModule ?? null,
          tag_number: tpl?.tag_number ?? null,
          project_name: tpl ? (projectMap[tpl.project_id] ?? 'Not Set') : 'Not Set',
          company_name: tpl ? (companyMap[tpl.company_id] ?? 'Not Set') : 'Not Set',
        };
      });

      return {
        data: result,
        total,
        page: pageNum,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) {  
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }






  // -------------------  PENDING BY QC -------------------------

  async pendingQc(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;


      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 3")
        .distinctOn(["itr.submission_id"])
        .orderBy("itr.submission_id", "DESC")
        .addOrderBy("pcmstemplate.id", "DESC");

      // SEARCHING
      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        production_assigned_to: "itr.production_assigned_to",
        requestor: "itr.requestor",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

    if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }

      // SORTING
      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col] || `pcmstemplate.${col}`;
        qb.addOrderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }

      qb.skip(skip).take(take);

      const data = await qb.getMany();


      const totalQb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoin("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 3")
        .select("COUNT(DISTINCT itr.submission_id)", "count");

      const totalResult = await totalQb.getRawOne();
      const total = Number(totalResult.count || 0);


      const projectIds = [...new Set(data.map((d) => d.project_id))];
      const companyIds = [...new Set(data.map((d) => d.company_id))];

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


      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const userIds = [
        ...new Set(
          itrList
            .map((it: any) => Number(it?.requestor))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalUsers = userIds.length
        ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr || [];
        const itr = itrArr[0] ?? {};

        return {
          ...v,
          submission_id: itr.submission_id ?? null,
          date_request: itr.date_request ?? null,
          report_resubmit_status: itr.report_resubmit_status ?? null,
          status_inspection: itr.status_inspection ?? null,
          requestor_name: userMap[itr.requestor] ?? "Not Set",
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
        };
      });

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) {  if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }





  // -------------- PENDING BY CLIENT ------------------
  async pendingClient(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;


      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 6")
        .distinctOn(["itr.submission_id"])
        .orderBy("itr.submission_id", "DESC")
        .addOrderBy("pcmstemplate.id", "DESC");

      // SEARCHING
      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        production_assigned_to: "itr.production_assigned_to",
        requestor: "itr.requestor",
        date_request: "itr.date_request",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

      if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }

      // SORTING
      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col] || `pcmstemplate.${col}`;
        qb.addOrderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }

      qb.skip(skip).take(take);

      const data = await qb.getMany();


      const totalQb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoin("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 6")
        .select("COUNT(DISTINCT itr.submission_id)", "count");

      const totalResult = await totalQb.getRawOne();
      const total = Number(totalResult.count || 0);


      const projectIds = [...new Set(data.map((d) => d.project_id))];
      const companyIds = [...new Set(data.map((d) => d.company_id))];

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


      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const userIds = [
        ...new Set(
          itrList
            .map((it: any) => Number(it?.requestor))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalUsers = userIds.length
        ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr || [];
        const itr = itrArr[0] ?? {};

        return {
          ...v,
          submission_id: itr.submission_id ?? null,
          date_request: itr.date_request ?? null,
          report_resubmit_status: itr.report_resubmit_status ?? null,
          status_inspection: itr.status_inspection ?? null,
          requestor_name: userMap[itr.requestor] ?? "Not Set",
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
        };
      });

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }


  //  --------------- APPROVAL BY CLIENT --------------

  async approvalClient(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;


      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 8")
        .distinctOn(["itr.submission_id"])
        .orderBy("itr.submission_id", "DESC")
        .addOrderBy("pcmstemplate.id", "DESC");

      // SEARCHING
      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        production_assigned_to: "itr.production_assigned_to",
        requestor: "itr.requestor",
        date_request: "itr.date_request",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

       if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }

      // SORTING
      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col] || `pcmstemplate.${col}`;
        qb.addOrderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }

      qb.skip(skip).take(take);

      const data = await qb.getMany();


      const totalQb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoin("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 8")
        .select("COUNT(DISTINCT itr.submission_id)", "count");

      const totalResult = await totalQb.getRawOne();
      const total = Number(totalResult.count || 0);


      const projectIds = [...new Set(data.map((d) => d.project_id))];
      const companyIds = [...new Set(data.map((d) => d.company_id))];

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


      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const userIds = [
        ...new Set(
          itrList
            .map((it: any) => Number(it?.requestor))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalUsers = userIds.length
        ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr || [];
        const itr = itrArr[0] ?? {};

        return {
          ...v,
          submission_id: itr.submission_id ?? null,
          date_request: itr.date_request ?? null,
          report_resubmit_status: itr.report_resubmit_status ?? null,
          status_inspection: itr.status_inspection ?? null,
          requestor_name: userMap[itr.requestor] ?? "Not Set",
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
        };
      });

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    }catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }



  // ---------------- SUMMARY RFI SUBMISSION ----------------

  async summaryRfi(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page, size } = queryDto;
      const take = size ?? 10;
      const skip = page * take;

      /* ================= QUERY UTAMA ================= */
      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection IN (:...status_inspection)", { status_inspection: [6, 7, 8] })
        .distinctOn(["itr.submission_id"])
        .orderBy("itr.submission_id", "DESC")
        .addOrderBy("pcmstemplate.id", "DESC");

      /* ================= COLUMN MAP ================= */
      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        requestor: "itr.requestor",
        date_request: "itr.date_request",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

      /* ================= SEARCH ================= */
       if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }


      /* ================= SORTING ================= */
      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col] || `pcmstemplate.${col}`;
        qb.addOrderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }

      qb.skip(skip).take(take);

      const data = await qb.getMany();

      /* ================= TOTAL COUNT ================= */
      const totalQb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoin("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection IS NOT NULL")
        .select("COUNT(DISTINCT itr.submission_id)", "count");

      const totalResult = await totalQb.getRawOne();
      const total = Number(totalResult?.count || 0);

      /* ================= PROJECT & COMPANY ================= */
      const projectIds = [...new Set(data.map((d) => d.project_id).filter(Boolean))];
      const companyIds = [...new Set(data.map((d) => d.company_id).filter(Boolean))];

      const projects = projectIds.length
        ? await this._project.findBy({ id: In(projectIds) })
        : [];

      const companies = companyIds.length
        ? await this._Portal_Company.findBy({ id_company: In(companyIds) })
        : [];

      const projectMap = Object.fromEntries(
        projects.map((p) => [p.id, p.project_name])
      );

      const companyMap = Object.fromEntries(
        companies.map((c) => [c.id_company, c.company_name])
      );

      /* ================= USER REQUESTOR ================= */
      const itrList = data.flatMap((d: any) => d.pcms_itr || []);
      const userIds = [
        ...new Set(
          itrList
            .map((it: any) => Number(it?.requestor))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalUsers = userIds.length
        ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      /* ================= FINAL RESULT ================= */
      const result = data.map((v: any) => {
        const itrArr = v.pcms_itr || [];
        const itr = itrArr[0] ?? {};

        return {
          ...v,
          submission_id: itr.submission_id ?? null,
          date_request: itr.date_request ?? null,
          report_resubmit_status: itr.report_resubmit_status ?? null,
          status_inspection: itr.status_inspection ?? null,

          requestor_name: itr.requestor
            ? userMap[itr.requestor] || "Not Set"
            : "Not Set",

          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
        };
      });

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    }catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }











  //  ------------- datatable assignment ITR (khusus SUPERVISOR) -------------

  async getAssignmentList(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size =10, drawing_no, type_of_module, discipline } = queryDto;
      const take = size;
      const skip = page * take;
      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
        .leftJoinAndSelect("pcmstemplate.cert_rel", "cert_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 0");


      // Mapping kolom filter
      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        event_id: "pcmstemplate.event_id",
        phase: "pcmstemplate.phase",
        serial_no: "pcmstemplate.serial_no",
        subsystem: "subsystem_rel.subsystem_name",
        system: "system_rel.system_name",
        cert_id: "cert_rel.cert_id",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        rating: "pcmstemplate.rating",
        manufacturer: "pcmstemplate.manufacturer",
        production_assigned_to: "itr.production_assigned_to",
        status_inspection: "itr.status_inspection",
      };


      if (drawing_no) {
        // console.log(drawing_no, "ini drawing")
        qb.andWhere("pcmstemplate.drawing_no = :drawing_no", {
          drawing_no,
        })
      }

      if (type_of_module) {
        // console.log(type_of_module, "ini type")
        qb.andWhere("typeModule.name = :type_of_module", {
          type_of_module
        })
      }

      if (discipline) {
        // console.log(discipline, "ini discipline")
        qb.andWhere("discipline.discipline_name = :discipline", {
          discipline,
        });
      }




      // Searching
      if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }


    // SORTING

      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col] || `pcmstemplate.${col}`;
        qb.orderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }


    const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

      // Project Mapping
     const projectIds = [
      ...new Set(
        data.map((item) => item.project_id).filter((id) => id && id !== 0)
      ),
    ];

    let projectMap: Record<number, string> = {};

    if (projectIds.length > 0) {
      const projects = await this._project.find({
        where: { id: In(projectIds) },
        select: ["id", "project_name"],
      });

      projectMap = projects.reduce((acc, p) => {
        acc[p.id] = p.project_name;
        return acc;
      }, {} as Record<number, string>);
    }


    const companyIds = [
      ...new Set(data.map((item) => item.company_id).filter(Boolean)),
    ];

    let companyMap: Record<number, string> = {};

    if (companyIds.length > 0) {
      const companies = await this._Portal_Company.find({
        where: { id_company: In(companyIds) },
      });

      companyMap = companies.reduce((acc, c) => {
        acc[c.id_company] = c.company_name;
        return acc;
      }, {} as Record<number, string>);
    }

      // ---------Mapping data hasil akhir--------
      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const assignedIds = [
        ...new Set(
          itrList
            .map((it: any) => {
              const v = it?.production_assigned_to;
              if (!v) return null;
              if (typeof v === "object") return Number(v.id_user ?? v.id ?? v);
              return Number(v);
            })
            .filter((id: number | null) => id !== null && !Number.isNaN(id)),
        ),
      ];

      const statusValues = itrList.map((it: any) => {
        const s = it?.status_inspection;
        if (s === null || s === undefined) return null;
        if (typeof s === "object") return Number(s?.id ?? s?.status_inspection ?? s);
        return Number(s);
      })

        .filter((v) => v !== null && !Number.isNaN(v));
      const statusIds = [...new Set(statusValues)];


      const portalUsers = assignedIds.length
        ? await this.portalUserRepo.findBy({
          id_user: In(assignedIds),
        }).then(users => users.map(u => ({ id_user: u.id_user, full_name: (u as any).full_name ?? (u as any).fullname ?? '' })))
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );


      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr;
        let assignedName = "Not Set";
        if (Array.isArray(itrArr) && itrArr.length > 0) {
          const pick = itrArr.find((it: any) => it?.production_assigned_to) ?? itrArr[0];
          const assigned = pick?.production_assigned_to;
          const assignedId = assigned && typeof assigned === "object"
            ? (assigned.id_user ?? assigned.id)
            : Number(assigned);
          if (assignedId && userMap[assignedId]) assignedName = userMap[assignedId];
        }

        return {
          ...v,
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
          assigned_to_name: assignedName,
        };
      });

      // ------------finished--------------

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }




  // ----------------------------------  EXPORT TO EXCEL (TAG REGISTER) -----------------------------------

  async export_excel(dto: GenerateExcelDto) {
    try {
      const {
        page = 0,
        size = 999999,
        sort,
        drawing_no,
        type_of_module,
        discipline,
        cert_id,
        search,
      } = dto;

      const result = await this.numbersList({
        page,
        size,
        sort,
        drawing_no,
        type_of_module,
        cert_id,
        discipline,
        search: search ? JSON.stringify(search) : undefined,
      } as any);

      if (!result.data || result.data.length === 0) {
        throw new NotFoundException("Data Tag Number not found!");
      }


      const rows = result.data.map((v) => ({
        project: v.project_name ?? "-",
        company: v.company_name ?? "-",
        drawing_no: v.drawing_no ?? "-",
        cert_id: v.cert_rel?.cert_id ?? "-",
        tag_number: v.tag_number,
        tag_description: v.tag_description,
        event_id: v.event_id ?? "-",
        discipline: v.discipline_tag?.discipline_name ?? "-",
        type_module: v.typeModule?.name ?? "-",
        module: v.templates_md?.mod_desc ?? "-",
        system: v.system_rel?.system_name ?? "-",
        subsystem: v.subsystem_rel?.subsystem_name ?? "-",
        location: v.location ?? "-",
        model_no: v.model_no ?? "-",
        serial_no: v.serial_no ?? "-",
        manufacturer: v.manufacturer,
        rating: v.rating,
        remarks: v.remarks ?? "-",
        __style: {}
      }));


      const buffer = await this.exportService.generateExcelStyle({
        sheetName: "PCMS TAG NUMBER LIST",
        title: "PCMS TAG NUMBER LIST",
        freezeHeader: true,
        striped: true,

        columns: [
          { header: "Project", key: "project", width: 20 },
          { header: "Company", key: "company", width: 20 },
          { header: "Drawing No", key: "drawing_no", width: 50 },
          { header: "Cert Id", key: "cert_id", width: 16 },
          { header: "Tag Number", key: "tag_number", width: 16 },
          { header: "Tag Description", key: "tag_description", width: 18 },
          { header: "Event ID", key: "event_id", width: 20 },
          { header: "Discipline", key: "discipline", width: 20 },
          { header: "Type Module", key: "type_module", width: 18 },
          { header: "Module", key: "module", width: 10 },
          { header: "System", key: "system", width: 20 },
          { header: "Subsystem", key: "subsystem", width: 20 },
          { header: "Location", key: "location", width: 20 },
          { header: "Model No", key: "model_no", width: 20 },
          { header: "Rating", key: "rating", width: 20 },
          { header: "Manufacturer", key: "manufacturer", width: 20 },
          { header: "Serial No", key: "serial_no", width: 20 },
          { header: "Remarks", key: "remarks", width: 25 },
        ],

        rows,

        styleOptions: {
          headerFill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "0080FF" }, // biru tua
          },
          headerFont: {
            color: { argb: "FFFFFFFF" },
            bold: true,
          },
          rowAlignment: {
            vertical: "middle",
          },
          columnStyles: {
            tag_description: {
              alignment: { wrapText: true },
            },
          },
        },
      });

      return buffer;
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }



  // ----------------------------------- EXPORT TO EXCEL (RFI SUBMISSION) -----------------------------------

  async exportRfi(dto: GenerateExcelDto) {
    try {
      const {
        page = 0,
        size = 999999,
        sort,
        drawing_no,
        type_of_module,
        discipline,
        search,
      } = dto;

      const result = await this.numbersList({
        page,
        size,
        sort,
        drawing_no,
        type_of_module,
        discipline,
        search: search ? JSON.stringify(search) : undefined,
      } as any);

      if (!result.data || result.data.length === 0) {
        throw new NotFoundException("Data Tag Number not found!");
      }


      const rows = result.data.map((v) => ({
        project: v.project_name ?? "-",
        company: v.company_name ?? "-",
        tag_number: v.tag_number,
        tag_description: v.tag_description,
        discipline: v.discipline_tag?.discipline_name ?? "-",
        type_module: v.typeModule?.name ?? "-",
        module: v.templates_md?.mod_desc ?? "-",
        system: v.system_rel?.system_name ?? "-",
        subsystem: v.subsystem_rel?.subsystem_name ?? "-",
        drawing_no: v.drawing_no ?? "-",
        location: v.location ?? "-",
        model_no: v.model_no ?? "-",
        manufacturer: v.manufacturer,
        rating: v.rating,
        remarks: v.remarks ?? "-",
        __style: {}
      }));


      const buffer = await this.exportService.generateExcelStyle({
        sheetName: "RFI-SUBMISSION DATA LIST",
        title: "RFI-SUBMISSION DATA LIST",
        freezeHeader: true,
        striped: true,

        columns: [
          { header: "Project", key: "project", width: 20 },
          { header: "Company", key: "company", width: 20 },
          { header: "Tag Number", key: "tag_number", width: 16 },
          { header: "Tag Description", key: "tag_description", width: 18 },
          { header: "Discipline", key: "discipline", width: 20 },
          { header: "Type Module", key: "type_module", width: 18 },
          { header: "Module", key: "module", width: 10 },
          { header: "System", key: "system", width: 20 },
          { header: "Subsystem", key: "subsystem", width: 20 },
          { header: "Drawing No", key: "drawing_no", width: 50 },
          { header: "Location", key: "location", width: 20 },
          { header: "Model No", key: "model_no", width: 20 },
          { header: "Rating", key: "rating", width: 20 },
          { header: "Manufacturer", key: "manufacturer", width: 20 },
          { header: "Remarks", key: "remarks", width: 25 },
        ],

        rows,

        styleOptions: {
          headerFill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "0080FF" }, // biru tua
          },
          headerFont: {
            color: { argb: "FFFFFFFF" },
            bold: true,
          },
          rowAlignment: {
            vertical: "middle",
          },
          columnStyles: {
            tag_description: {
              alignment: { wrapText: true },
            },
          },
        },
      });

      return buffer;
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }





  // -------------------------------------- EXPORT TO EXCEL (ITR ASSIGNMENT) -----------------------------------

  async generate_excel(dto: GenerateExcelDto) {
    try {
      const {
        page = 0,
        size = 999999,
        sort,
        drawing_no,
        type_of_module,
        discipline,
        cert_id,
        search,
      } = dto;

      const result = await this.getAssignmentList({
        page,
        size,
        sort,
        drawing_no,
        type_of_module,
        discipline,
        cert_id,
        search: search ? JSON.stringify(search) : undefined,
      } as any);

      if (!result.data || result.data.length === 0) {
        throw new NotFoundException("Data assignment Not Found!");
      }


      const rows = result.data.map((v) => ({
        tag_number: v.tag_number,
        tag_description: v.tag_description,
        discipline: v.discipline_tag?.discipline_name ?? "-",
        type_module: v.typeModule?.name ?? "-",
        module: v.templates_md?.mod_desc ?? "-",
        system: v.system_rel?.system_name ?? "-",
        subsystem: v.subsystem_rel?.subsystem_name ?? "-",
        cert_id: v.cert_rel?.cert_id ?? "-",
        drawing_no: v.drawing_no ?? "-",
        event_id: v.event_id ?? "-",
        location: v.location ?? "-",
        model_no: v.model_no ?? "-",
        project: v.project_name ?? "-",
        company: v.company_name ?? "-",
        assigned_to: v.assigned_to_name ?? "Not Set",
        __style: {}
      }));

      const buffer = await this.exportService.generateExcelStyle({
        sheetName: "PCMS ITR ASSIGNMENT LIST",
        title: "PCMS ITR ASSIGNMENT LIST",
        freezeHeader: true,
        striped: true,

        columns: [
          { header: "Tag Number", key: "tag_number", width: 16 },
          { header: "Tag Description", key: "tag_description", width: 18 },
          { header: "Discipline", key: "discipline", width: 20 },
          { header: "Type Module", key: "type_module", width: 18 },
          { header: "Module", key: "module", width: 10 },
          { header: "System", key: "system", width: 20 },
          { header: "Subsystem", key: "subsystem", width: 20 },
          { header: "Drawing No", key: "drawing_no", width: 45 },
          { header: "Cert ID", key: "cert_id", width: 18 },
          { header: "Event ID", key: "event_id", width: 45 },
          { header: "Location", key: "location", width: 20 },
          { header: "Model No", key: "model_no", width: 20 },
          { header: "Project", key: "project", width: 20 },
          { header: "Company", key: "company", width: 20 },
          { header: "Assigned To", key: "assigned_to", width: 30 },
        ],

        rows,

        styleOptions: {
          headerFill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "0080FF" }, // biru tua
          },
          headerFont: {
            color: { argb: "FFFFFFFF" },
            bold: true,
          },
          rowAlignment: {
            vertical: "middle",
          },
          columnStyles: {
            tag_description: {
              alignment: { wrapText: true },
            },
          },
        },
      });

      return buffer;
    } catch (error) {  if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }





  // -------------------------- POST DATA FITUP EXCEL --------------------------

  async exportReport(dto: FitupExcelDto) {
    try {
      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.system_rel", "system")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1");

      /* ================= FILTER ================= */
      if (dto.discipline) {
        qb.andWhere("discipline.id = :discipline", {
          discipline: dto.discipline,
        });
      }

      if (dto.type_of_module) {
        qb.andWhere("typeModule.id = :typeModule", {
          typeModule: dto.type_of_module,
        });
      }

      if (dto.status_inspection !== undefined && dto.status_inspection !== null) {
        qb.andWhere("itr.status_inspection = :statusInspection", {
          statusInspection: dto.status_inspection,
        });
      }

      const data = await qb.getMany();

      // -------- AMBIL DATA PROJECT --------
      const projectIds = [
        ...new Set(
          data
            .map((d: any) => Number(d.project_id))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalProjects = projectIds.length
        ? await this._project.findBy({ id: In(projectIds) })
        : [];

      const projectMap = Object.fromEntries(
        portalProjects.map((p: any) => [p.id, p.project_name])
      );


      // -------- AMBIL DATA COMPANY --------

      const companyIds = [
        ...new Set(
          data
            .map((d: any) => Number(d.company_id))
            .filter((id_company) => id_company && !isNaN(id_company))
        ),
      ];

      const portalCompany = companyIds.length
        ? await this._Portal_Company.findBy({ id_company: In(companyIds) })
        : [];

      const companyMap = Object.fromEntries(
        portalCompany.map((c: any) => [c.id_company, c.company_name])
      );


      if (!data.length) {
        throw new NotFoundException("Data not found");
      }


      /* ================= AMBIL USER PORTAL ================= */
      const itrList = data.flatMap((d: any) => d.pcms_itr || []);

      const userIds = [
        ...new Set(
          itrList
            .map((it: any) => Number(it?.requestor))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalUsers = userIds.length
        ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      /* ================= STATUS MAP ================= */
      const STATUS_INSPECTION_MAP: Record<number, string> = {
        0: "Pending Submission by Spv",
        1: "Submission By Spv",
        2: "Reject By Spv",
        3: "Pending By QC",
        4: "Reject By QC",
        5: "Approve By QC",
        6: "Pending By Client",
        7: "Reject By Client",
        8: "Approve By Client",
      };

      /* ================= MAP KE EXCEL ================= */
      const rows = data.map((item: any) => {
        const itr = item.pcms_itr?.[0]; // aman karena sudah difilter

        return {
          tag_number: item.tag_number,
          tag_description: item.tag_description,
          discipline: item.discipline_tag?.discipline_name || "-",
          type_module: item.typeModule?.name || "-",
          module: item.templates_md?.mod_desc || "-",
          system: item.system_rel?.system_name || "-",
          subsystem: item.subsystem_rel?.subsystem_name || "-",
          drawing_no: item.drawing_no || "-",
          location: item.location || "-",
          phase: item.phase || "-",
          model_no: item.model_no || "-",
          project: item.project_id
            ? projectMap[item.project_id] || "-"
            : "-",
          company: item.company_id
            ? companyMap[item.company_id] || "-"
            : "-",
          requestor: itr?.requestor
            ? userMap[itr.requestor] || "-"
            : "-",
          remarks: item.remarks || "-",
          status_inspection:
            itr?.status_inspection !== undefined
              ? STATUS_INSPECTION_MAP[itr.status_inspection] || "-"
              : "-",
        };
      });

      return await this.exportService.generateExcelStyle({
        sheetName: "EXPORT DATA MECHANICAL COMPLETION",
        columns: [
          { header: "Project", key: "project", width: 25 },
          { header: "Tag Number", key: "tag_number", width: 16 },
          { header: "Company", key: "company", width: 20 },
          { header: "Tag Description", key: "tag_description", width: 18 },
          { header: "Discipline", key: "discipline", width: 20 },
          { header: "Type Module", key: "type_module", width: 18 },
          { header: "Module", key: "module", width: 12 },
          { header: "System", key: "system", width: 20 },
          { header: "Subsystem", key: "subsystem", width: 20 },
          { header: "Drawing No", key: "drawing_no", width: 45 },
          { header: "Location", key: "location", width: 20 },
          { header: "Phase", key: "phase", width: 20 },
          { header: "Model No", key: "model_no", width: 20 },
          { header: "Requestor", key: "requestor", width: 28 },
          { header: "Remarks", key: "remarks", width: 25 },
          { header: "Status Inspection", key: "status_inspection", width: 25 },
        ],
        rows,
        styleOptions: {
          headerFill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "0080FF" },
          },
          headerFont: {
            color: { argb: "FFFFFFFF" },
            bold: true,
          },
          rowAlignment: {
            vertical: "middle",
          },
          columnStyles: {
            tag_description: {
              alignment: { wrapText: true },
            },
          },
        },
      });
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }












  // --------------------------------------- GET REJECTED ( SUPERVISOR )----------------------------------- 

  async getRejectedList(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;
      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 2");


      // Mapping kolom filter
     const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        event_id: "pcmstemplate.event_id",
        phase: "pcmstemplate.phase",
        serial_no: "pcmstemplate.serial_no",
        subsystem: "subsystem_rel.subsystem_name",
        system: "system_rel.system_name",
        cert_id: "cert_rel.cert_id",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        rating: "pcmstemplate.rating",
        manufacturer: "pcmstemplate.manufacturer",
        production_assigned_to: "itr.production_assigned_to",
        status_inspection: "itr.status_inspection",
      };

      // Searching
      if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }

    // SORTING 

       if (sort) {
      const [col, dir] = sort.split(",");

      const direction = dir?.toUpperCase() === "DESC" ? "DESC" : "ASC";

      if (col === "discipline") {
        qb.orderBy("discipline.discipline_name", direction);
      } else if (col === "module") {
        qb.orderBy("templates_md.mod_desc", direction);
      } else if (col === "type_of_module") {
        qb.orderBy("typeModule.name", direction);
      } else {
        qb.orderBy(`pcmstemplate.${col}`, direction);
      }
    } else {
      qb.orderBy("pcmstemplate.id", "DESC");
    }


      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();


      // PROJECT MAPPING
     const projectIds = [
      ...new Set(
        data.map((item) => item.project_id).filter((id) => id && id !== 0)
      ),
     ];

     let projectMap: Record<number, string> = {};

      if (projectIds.length > 0) {
        const projects = await this._project.find({
          where: { id: In(projectIds) },
          select: ["id", "project_name"],
        });

        projectMap = projects.reduce((acc, p) => {
          acc[p.id] = p.project_name;
          return acc;
        }, {} as Record<number, string>);
      }

      // COMPANY MAPPING
      const companyIds = [
        ...new Set(
          data.map((item) => item.company_id).filter(Boolean)
        ),
      ];

      let companyMap: Record<number, string> = {};

      if (companyIds.length > 0) {
        const companies = await this._Portal_Company.find({
          where: { id_company: In(companyIds) },
        });
        
        companyMap = companies.reduce((acc, c) => {
          acc[c.id_company] = c.company_name;
          return acc;
        }, {} as Record<number, string>);
      }



      // ---------Mapping data hasil akhir--------
      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const assignedIds = [
        ...new Set(
          itrList
            .map((it: any) => {
              const v = it?.production_assigned_to;
              if (!v) return null;
              if (typeof v === "object") return Number(v.id_user ?? v.id ?? v);
              return Number(v);
            })
            .filter((id: number | null) => id !== null && !Number.isNaN(id)),
        ),
      ];

      const statusValues = itrList.map((it: any) => {
        const s = it?.status_inspection;
        if (s === null || s === undefined) return null;
        if (typeof s === "object") return Number(s?.id ?? s?.status_inspection ?? s);
        return Number(s);
      })

        .filter((v) => v !== null && !Number.isNaN(v));
      const statusIds = [...new Set(statusValues)];

      // const statusLabel = (code: number | null) => {
      //   if (code === null || code === undefined) return "Not Set";
      //   switch (Number(code)) {
      //     case 0:
      //       return "Pending";
      //     case 1:
      //       return "Accepted";
      //     case 2:
      //       return "Rejected";
      //     default:
      //       return String(code);
      //   }
      // };


      // fetch only id_user + full_name from portal DB
      const portalUsers = assignedIds.length
        ? await this.portalUserRepo.findBy({
          id_user: In(assignedIds),
        }).then(users => users.map(u => ({ id_user: u.id_user, full_name: (u as any).full_name ?? (u as any).fullname ?? '' })))
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      // map result and set assigned_to_name using userMap
      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr;
        let assignedName = "Not Set";
        if (Array.isArray(itrArr) && itrArr.length > 0) {
          const pick = itrArr.find((it: any) => it?.production_assigned_to) ?? itrArr[0];
          const assigned = pick?.production_assigned_to;
          const assignedId = assigned && typeof assigned === "object"
            ? (assigned.id_user ?? assigned.id)
            : Number(assigned);
          if (assignedId && userMap[assignedId]) assignedName = userMap[assignedId];
        }

        let pickItr =
          itrArr.find((it: any) => it && it.submission_id && String(it.submission_id).trim() !== "") ??
          (itrArr.length ? itrArr.slice().sort((a: any, b: any) => (b.id_itr || 0) - (a.id_itr || 0))[0] : null);

        const submission_id = pickItr?.submission_id ?? null;
        // const date_request = pickItr?.date_request ?? null;

        return {
          ...v,
          submission_id,
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
          assigned_to_name: assignedName,
        };
      });

      // ------------finished--------------

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) {  if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }



  //  ------------------------------------ GET REJECTED TO CLIENT ------------------------------

  async getRejectedClient(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;
      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 7");


      // Mapping kolom filter
      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        system: "system_rel.system_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        event_id: "pcmstemplate.event_id",
        phase: "pcmstemplate.phase",
        manufacturer: "pcmstemplate.manufacturer",
        model_no: "pcmstemplate.model_no",
        rating: "pcmstemplate.rating",
        serial_no: "pcmstemplate.serial_no",
        production_assigned_to: "itr.production_assigned_to",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

      // Searching
      if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }



        if (sort) {
      const [col, dir] = sort.split(",");

      const direction = dir?.toUpperCase() === "DESC" ? "DESC" : "ASC";

      if (col === "discipline") {
        qb.orderBy("discipline.discipline_name", direction);
      } else if (col === "module") {
        qb.orderBy("templates_md.mod_desc", direction);
      } else if (col === "type_of_module") {
        qb.orderBy("typeModule.name", direction);
      } else {
        qb.orderBy(`pcmstemplate.${col}`, direction);
      }
    } else {
      qb.orderBy("pcmstemplate.id", "DESC");
    }



      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();


       // PROJECT MAPPING
     const projectIds = [
      ...new Set(
        data.map((item) => item.project_id).filter((id) => id && id !== 0)
      ),
     ];

     let projectMap: Record<number, string> = {};

      if (projectIds.length > 0) {
        const projects = await this._project.find({
          where: { id: In(projectIds) },
          select: ["id", "project_name"],
        });

        projectMap = projects.reduce((acc, p) => {
          acc[p.id] = p.project_name;
          return acc;
        }, {} as Record<number, string>);
      }

      // COMPANY MAPPING
      const companyIds = [
        ...new Set(
          data.map((item) => item.company_id).filter(Boolean)
        ),
      ];

      let companyMap: Record<number, string> = {};

      if (companyIds.length > 0) {
        const companies = await this._Portal_Company.find({
          where: { id_company: In(companyIds) },
        });
        
        companyMap = companies.reduce((acc, c) => {
          acc[c.id_company] = c.company_name;
          return acc;
        }, {} as Record<number, string>);
      }



      // ---------Mapping data hasil akhir--------
      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const assignedIds = [
        ...new Set(
          itrList
            .map((it: any) => {
              const v = it?.production_assigned_to;
              if (!v) return null;
              if (typeof v === "object") return Number(v.id_user ?? v.id ?? v);
              return Number(v);
            })
            .filter((id: number | null) => id !== null && !Number.isNaN(id)),
        ),
      ];

      const statusValues = itrList.map((it: any) => {
        const s = it?.status_inspection;
        if (s === null || s === undefined) return null;
        if (typeof s === "object") return Number(s?.id ?? s?.status_inspection ?? s);
        return Number(s);
      })

        .filter((v) => v !== null && !Number.isNaN(v));
      const statusIds = [...new Set(statusValues)];

      // fetch only id_user + full_name from portal DB
      const portalUsers = assignedIds.length
        ? await this.portalUserRepo.findBy({
          id_user: In(assignedIds),
        }).then(users => users.map(u => ({ id_user: u.id_user, full_name: (u as any).full_name ?? (u as any).fullname ?? '' })))
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      // map result and set assigned_to_name using userMap
      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr;
        let assignedName = "Not Set";
        if (Array.isArray(itrArr) && itrArr.length > 0) {
          const pick = itrArr.find((it: any) => it?.production_assigned_to) ?? itrArr[0];
          const assigned = pick?.production_assigned_to;
          const assignedId = assigned && typeof assigned === "object"
            ? (assigned.id_user ?? assigned.id)
            : Number(assigned);
          if (assignedId && userMap[assignedId]) assignedName = userMap[assignedId];
        }

        let pickItr =
          itrArr.find((it: any) => it && it.submission_id && String(it.submission_id).trim() !== "") ??
          (itrArr.length ? itrArr.slice().sort((a: any, b: any) => (b.id_itr || 0) - (a.id_itr || 0))[0] : null);

        const submission_id = pickItr?.submission_id ?? null;
        // const date_request = pickItr?.date_request ?? null;

        return {
          ...v,
          submission_id,
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
          assigned_to_name: assignedName,
        };
      });

      // ------------finished--------------

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }




  // --------------------------------------- TRANSMITTAL BY QC -----------------------------------

  async transmittalQc(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page, size } = queryDto;
      const take = size ?? 10;
      const skip = page * take;

      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 5")
        .orderBy("itr.id_itr", "DESC")
        // .distinctOn(["itr.submission_id"])
        // .orderBy("itr.submission_id", "DESC")
        // .addOrderBy("itr.id_itr", "DESC");

      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        system: "system_rel.system_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        date_request: "itr.date_request",
        production_assigned_to: "itr.production_assigned_to",
        requestor: "itr.requestor",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };
      // SEARCHING
      if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }

      // SORTING
      if (sort) {
        const [col, dir] = sort.split(",");
        const column = columnMap[col] || `pcmstemplate.${col}`;
        qb.addOrderBy(column, dir.toUpperCase() as "ASC" | "DESC");
      }


      qb.skip(skip).take(take);

      const data = await qb.getMany();


      const totalQb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoin("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 5")
        .select("COUNT(itr.id_itr)", "count");

      const totalResult = await totalQb.getRawOne();
      const total = Number(totalResult.count || 0);


      const projectIds = [...new Set(data.map((d) => d.project_id))];
      const companyIds = [...new Set(data.map((d) => d.company_id))];

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


      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const userIds = [
        ...new Set(
          itrList
            .map((it: any) => Number(it?.requestor))
            .filter((id) => id && !isNaN(id))
        ),
      ];

      const portalUsers = userIds.length
        ? await this.portalUserRepo.findBy({ id_user: In(userIds) })
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      const result = data.map((v) => {
        const itr = (v as any).pcms_itr?.[0] || {};
        // const itrArr = (v as any).pcms_itr || [];
        // const itr = (Array.isArray(itrArr) && itrArr.length)
        //   ? itrArr.slice().sort((a: any, b: any) => (b.id_itr || 0) - (a.id_itr || 0))[0]
        //   : {};

        return {
          ...v,
          submission_id: itr.submission_id ?? null,
          date_request: itr.date_request ?? null,
          report_resubmit_status: itr.report_resubmit_status ?? null,
          status_inspection: itr.status_inspection ?? null,
          requestor_name: userMap[itr.requestor] ?? "Not Set",
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
        };
      });

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }


  // --------------------------------------- GET REJECTED QC ( Quality Control )----------------------------------- 

  async getRejectedQc(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page = 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;
      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
        .leftJoinAndSelect("pcmstemplate.pcms_itr", "itr")
        .where("pcmstemplate.assignment_status = 1")
        .andWhere("itr.status_inspection = 4");


      // Mapping kolom filter
      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        subsystem: "subsystem_rel.subsystem_name",
        system: "system_rel.system_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        manufacturer: "pcmstemplate.manufacturer",
        rating: "pcmstemplate.rating",
        serial_no: "pcmstemplate.serial_no",
        phase: "pcmstemplate.phase",
        event_id: "pcmstemplate.event_id",
        production_assigned_to: "itr.production_assigned_to",
        status_inspection: "itr.status_inspection",
        submission_id: "itr.submission_id",
      };

      // Searching
     if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }

    // SORTING
      if (sort) {
      const [col, dir] = sort.split(",");

      const direction = dir?.toUpperCase() === "DESC" ? "DESC" : "ASC";

      if (col === "discipline") {
        qb.orderBy("discipline.discipline_name", direction);
      } else if (col === "module") {
        qb.orderBy("templates_md.mod_desc", direction);
      } else if (col === "type_of_module") {
        qb.orderBy("typeModule.name", direction);
      } else {
        qb.orderBy(`pcmstemplate.${col}`, direction);
      }
    } else {
      qb.orderBy("pcmstemplate.id", "DESC");
    }


      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();


       const projectIds = [
      ...new Set(
        data.map((item) => item.project_id).filter((id) => id && id !== 0)
      ),
    ];

    let projectMap: Record<number, string> = {};

    if (projectIds.length > 0) {
      const projects = await this._project.find({
        where: { id: In(projectIds) },
        select: ["id", "project_name"],
      });

      projectMap = projects.reduce((acc, p) => {
        acc[p.id] = p.project_name;
        return acc;
      }, {} as Record<number, string>);
    }

    /* ============================================================
       COMPANY MAPPING
    ============================================================ */

    const companyIds = [
      ...new Set(data.map((item) => item.company_id).filter(Boolean)),
    ];

    let companyMap: Record<number, string> = {};

    if (companyIds.length > 0) {
      const companies = await this._Portal_Company.find({
        where: { id_company: In(companyIds) },
      });

      companyMap = companies.reduce((acc, c) => {
        acc[c.id_company] = c.company_name;
        return acc;
      }, {} as Record<number, string>);
    }


      // ---------Mapping data hasil akhir--------
      const itrList = data.flatMap((d) => (d as any).pcms_itr || []);
      const assignedIds = [
        ...new Set(
          itrList
            .map((it: any) => {
              const v = it?.production_assigned_to;
              if (!v) return null;
              if (typeof v === "object") return Number(v.id_user ?? v.id ?? v);
              return Number(v);
            })
            .filter((id: number | null) => id !== null && !Number.isNaN(id)),
        ),
      ];

      const statusValues = itrList.map((it: any) => {
        const s = it?.status_inspection;
        if (s === null || s === undefined) return null;
        if (typeof s === "object") return Number(s?.id ?? s?.status_inspection ?? s);
        return Number(s);
      })

        .filter((v) => v !== null && !Number.isNaN(v));
      const statusIds = [...new Set(statusValues)];



      // fetch only id_user + full_name from portal DB
      const portalUsers = assignedIds.length
        ? await this.portalUserRepo.findBy({
          id_user: In(assignedIds),
        }).then(users => users.map(u => ({ id_user: u.id_user, full_name: (u as any).full_name ?? (u as any).fullname ?? '' })))
        : [];

      const userMap = Object.fromEntries(
        portalUsers.map((u: any) => [u.id_user, u.full_name])
      );

      // map result and set assigned_to_name using userMap
      const result = data.map((v) => {
        const itrArr = (v as any).pcms_itr;
        let assignedName = "Not Set";
        if (Array.isArray(itrArr) && itrArr.length > 0) {
          const pick = itrArr.find((it: any) => it?.production_assigned_to) ?? itrArr[0];
          const assigned = pick?.production_assigned_to;
          const assignedId = assigned && typeof assigned === "object"
            ? (assigned.id_user ?? assigned.id)
            : Number(assigned);
          if (assignedId && userMap[assignedId]) assignedName = userMap[assignedId];
        }

        let pickItr =
          itrArr.find((it: any) => it && it.submission_id && String(it.submission_id).trim() !== "") ??
          (itrArr.length ? itrArr.slice().sort((a: any, b: any) => (b.id_itr || 0) - (a.id_itr || 0))[0] : null);

        const submission_id = pickItr?.submission_id ?? null;
        // const date_request = pickItr?.date_request ?? null;

        return {
          ...v,
          submission_id,
          project_name: projectMap[v.project_id] || "Not Set",
          company_name: companyMap[v.company_id] || "Not Set",
          assigned_to_name: assignedName,
        };
      });

      // ------------finished--------------

      return {
        data: result,
        total,
        page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    }catch (error) {
       if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }






  // ------------- find all ---------------

  async findAll(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page, size } = queryDto;

    

      const whereConditions: any[] = [];
      const baseConditions: any = {};
      const order: any = {};
      const skip: number = ((page ?? 1) - 1) * (size ?? 10);
      const { discipline, module, type_of_module, subsystem } = search
        ? JSON.parse(search)
        : {};

      if (sort) {
        var orderBy = sort.split(",");
        order[orderBy[0]] = orderBy[1];
      }

      if (search) {
        whereConditions.push({
          ...baseConditions,
          remarks: ILike(`%${search}%`),
        });
      } else {
        whereConditions.push(baseConditions);
      }

      const where: any = {};
      if (discipline)
        where.discipline = { discipline_name: ILike(`%${discipline}%`) };
      if (module) where.module = { mod_desc: ILike(`%${module}%`) };
      if (type_of_module)
        where.type_of_module = { name: ILike(`%${type_of_module}%`) };

      const [data, total] = await this.pcmsTemplateRepo.findAndCount({
        where: whereConditions,
        order: order,
        skip: skip,
        take: size ?? 10,
        relations: [
          "discipline_tag",
          "typeModule",
          "templates_md",
          "subsystem_rel",
        ],
      });

      return {
        content: data,
        total: total,
        pageIndex: page,
        totalPages: 100,
        size: size ?? 10,
        total_pages: Math.ceil(total / (size ?? 10)),
      };
    } catch (error) {
       if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }


  async findOne(id: number): Promise<PcmsMcTemplate> {
  const data = await this.pcmsTemplateRepo.findOne({
    where: { id },
    relations: [
      'discipline_tag',
      'typeModule',
      'templates_md',
      'subsystem_rel',
    ],
  });

  if (!data) {
    throw new NotFoundException('there is Undefined');
  }

  return data;
}


  async create(
    data: Partial<PcmsMcTemplate>,
    iduser: number
  ): Promise<PcmsMcTemplate> {
    try {
      const dataForm = { ...data, created_by: iduser };
      const form = this.pcmsTemplateRepo.create(dataForm);
      return this.pcmsTemplateRepo.save(form);
    } catch (error) {
       if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }


  async getDropdownData() {
    try {
      const projects = await this._project.find({
        select: ["id", "project_name"],
      });

      const companies = await this._Portal_Company.find({
        select: ["id_company", "company_name"],
      });

      return {
        projects,
        companies,
      };
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }




  /**
   * -------- Update template --------- */

  async update(id: number, data: Partial<PcmsMcTemplate>): Promise<PcmsMcTemplate> {
    let { updated_by, discipline, module, type_of_module, subsystem, project_id, company_id, ...restData } = data;

    if ("" in restData) {
      delete (restData as any).phase_name;
    }

    if (updated_by) {
      updated_by = Number(this.aesEcb.decryptBase64Url(String(updated_by)));
    }

    const oldData = await this.pcmsTemplateRepo.findOne({ where: { id } });

    const newData: any = {
      ...oldData,
      ...restData,
      updated_by,
    };

    // 🔹 Discipline relasi
    if (discipline) {
      const disciplineEntity = await this.MasterDisciplineRepo.findOne({
        where: { id: Number(discipline) },
      });
      newData.discipline_tag = disciplineEntity;
      newData.discipline = Number(discipline);
    }

    // 🔹 Module relasi
    if (module) {
      const moduleEntity = await this.masterModuleRepo.findOne({
        where: { mod_id: Number(module) },
      });
      newData.templates_md = moduleEntity;
      newData.module = Number(module);
    }

    // 🔹 Type of module relasi
    if (type_of_module) {
      const typeEntity = await this.typeModuleRepo.findOne({
        where: { id: Number(type_of_module) },
      });
      newData.typeModule = typeEntity;
      newData.type_of_module = Number(type_of_module);
    }

    // 🔹 Subsystem relasi
    if (subsystem) {
      const subsystemEntity = await this.subsystemRepo.findOne({
        where: { id: Number(subsystem) },
      });
      newData.subsystem_rel = subsystemEntity;
      newData.subsystem = Number(subsystem);
    }

    if (project_id) {
      const projectEntity = await this._project.findOne({
        where: { id: Number(project_id) },
      });
      if (!projectEntity) throw new NotFoundException("Project not found");
      newData.project_id = Number(project_id); // simpan id project
    }

    if (company_id) {
      const companyEntity = await this._Portal_Company.findOne({
        where: { id_company: Number(company_id) },
      });
      if (!companyEntity) throw new NotFoundException("Company not found");
      newData.company_id = Number(company_id);
    }

    await this.pcmsTemplateRepo.save(newData);
    return this.findOne(id);
  }


  /**
   * ------------ Delete template -----------------
   */
  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    try {
      await this.pcmsTemplateRepo.remove(template);
    } catch (error) {
      throw new InternalServerErrorException("Failed to delete template");
    }
  }


 async findByIds(ids: number[]) {
  const data = await this.pcmsTemplateRepo.find({
    where: { id: In(ids) },
    relations: [
      'discipline_tag',
      'typeModule',
      'templates_md',
      'subsystem_rel',
    ],
  });

  const arr_id_project: number[] = [];
  data.forEach((element) => {
    arr_id_project.push(element.project_id);
  });

  const arr_company_id: number[] = [];
  data.forEach((element) => {
    arr_company_id.push(element.company_id);
  });

  // unique
  const uniqueProjectIds = [...new Set(arr_id_project)];
  const uniqueCompanyIds = [...new Set(arr_company_id)];

  const projects = await this._project.findBy({
    id: In(uniqueProjectIds),
  });

  const projectMap = projects.reduce<Record<number, string>>(
    (map, project) => {
      map[project.id] = project.project_name;
      return map;
    },
    {},
  );

  const companies = await this._Portal_Company.findBy({
    id_company: In(uniqueCompanyIds),
  });

  const companyMap = companies.reduce<Record<number, string>>(
    (map, comp) => {
      map[comp.id_company] = comp.company_name;
      return map;
    },
    {},
  );

  return data.map((v) => ({
    ...v,
    project_name: projectMap[v.project_id] ?? 'Not Set',
    company_name: companyMap[v.company_id] ?? 'Not Set',
  }));
}




  // ------------- TAG NUMBERS ----------------

async numbersList(queryDto: ServerSideDTO) {
  try {
    const { sort, search, page = 0, size = 10 } = queryDto;

    const take = size;
    const skip = page * take;

    const qb = this.pcmsTemplateRepo
      .createQueryBuilder("pcmstemplate")
      .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
      .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
      .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
      .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
      .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
      .leftJoinAndSelect("pcmstemplate.cert_rel", "cert_rel")
      .andWhere("discipline.id IS NOT NULL");


    const columnMap: Record<string, string> = {
      discipline: "discipline.discipline_name",
      type_of_module: "typeModule.name",
      module: "templates_md.mod_desc",
      subsystem: "subsystem_rel.subsystem_name",
      system: "system_rel.system_name",
      cert_id: "cert_rel.cert_id",
      tag_number: "pcmstemplate.tag_number",
      drawing_no: "pcmstemplate.drawing_no",
      event_id: "pcmstemplate.event_id",
      tag_description: "pcmstemplate.tag_description",
      subsystem_description: "pcmstemplate.subsystem_description",
      phase: "pcmstemplate.phase",
      location: "pcmstemplate.location",
      model_no: "pcmstemplate.model_no",
      serial_no: "pcmstemplate.serial_no",
      rating: "pcmstemplate.rating",
      manufacturer: "pcmstemplate.manufacturer",
    };

    /* ============================================================
       SEARCH SECTION (PROJECT & COMPANY FIX)
    ============================================================ */

    if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }

    /* ============================================================
       SORTING SECTION
    ============================================================ */

    if (sort) {
      const [col, dir] = sort.split(",");

      const direction = dir?.toUpperCase() === "DESC" ? "DESC" : "ASC";

      if (col === "discipline") {
        qb.orderBy("discipline.discipline_name", direction);
      } else if (col === "module") {
        qb.orderBy("templates_md.mod_desc", direction);
      } else if (col === "type_of_module") {
        qb.orderBy("typeModule.name", direction);
      } else {
        qb.orderBy(`pcmstemplate.${col}`, direction);
      }
    } else {
      qb.orderBy("pcmstemplate.id", "DESC");
    }

    /* ============================================================
       EXECUTE QUERY
    ============================================================ */

    const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

    /* ============================================================
       PROJECT MAPPING
    ============================================================ */

    const projectIds = [
      ...new Set(
        data.map((item) => item.project_id).filter((id) => id && id !== 0)
      ),
    ];

    let projectMap: Record<number, string> = {};

    if (projectIds.length > 0) {
      const projects = await this._project.find({
        where: { id: In(projectIds) },
        select: ["id", "project_name"],
      });

      projectMap = projects.reduce((acc, p) => {
        acc[p.id] = p.project_name;
        return acc;
      }, {} as Record<number, string>);
    }

    /* ============================================================
       COMPANY MAPPING
    ============================================================ */

    const companyIds = [
      ...new Set(data.map((item) => item.company_id).filter(Boolean)),
    ];

    let companyMap: Record<number, string> = {};

    if (companyIds.length > 0) {
      const companies = await this._Portal_Company.find({
        where: { id_company: In(companyIds) },
      });

      companyMap = companies.reduce((acc, c) => {
        acc[c.id_company] = c.company_name;
        return acc;
      }, {} as Record<number, string>);
    }

    /* ============================================================
       FINAL RESULT
    ============================================================ */

    const result = data.map((item) => ({
      ...item,
      project_name: projectMap[item.project_id] || "Not Set",
      company_name: companyMap[item.company_id] || "Not Set",
    }));

    return {
      data: result,
      total,
      page,
      limit: take,
      total_pages: Math.ceil(total / take),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new InternalServerErrorException(error.message);
    }
    throw new InternalServerErrorException("There is an error");
  }
}





  // -------- search -----------------
  async serverSideList(queryDto: ServerSideDTO) {
    try {
      const { sort, search, page= 0, size = 10 } = queryDto;
      const take = size;
      const skip = page * take;


      const qb = this.pcmsTemplateRepo
        .createQueryBuilder("pcmstemplate")
        .leftJoinAndSelect("pcmstemplate.discipline_tag", "discipline")
        .leftJoinAndSelect("pcmstemplate.typeModule", "typeModule")
        .leftJoinAndSelect("pcmstemplate.templates_md", "templates_md")
        .leftJoinAndSelect("pcmstemplate.subsystem_rel", "subsystem_rel")
        .leftJoinAndSelect("pcmstemplate.system_rel", "system_rel")
        .leftJoinAndSelect("pcmstemplate.cert_rel", "cert_rel")
        .where("pcmstemplate.assignment_status IS NULL")


      const columnMap: Record<string, string> = {
        discipline: "discipline.discipline_name",
        type_of_module: "typeModule.name",
        module: "templates_md.mod_desc",
        system: "system_rel.system_name",
        cert_id: "cert_rel.cert_id",
        Subsystem: "subsystem_rel.subsystem_name",
        company_name: "pcmstemplate.company_name",
        tag_number: "pcmstemplate.tag_number",
        drawing_no: "pcmstemplate.drawing_no",
        tag_description: "pcmstemplate.tag_description",
        subsystem_description: "pcmstemplate.subsystem_description",
        phase: "pcmstemplate.phase",
        location: "pcmstemplate.location",
        model_no: "pcmstemplate.model_no",
        rating: "pcmstemplate.rating",
        manufacturer: "pcmstemplate.manufacturer",
      };

      // 🔹 Sorting
      if (sort) {
        const [col, dir] = sort.split(",");
        if (col === "mod_desc") {
          qb.orderBy("templates_md.mod_desc", dir.toUpperCase() as "ASC" | "DESC");
        } else if (col === "discipline_name") {
          qb.orderBy("discipline.discipline_name", dir.toUpperCase() as "ASC" | "DESC");
        } else if (col === "name") {
          qb.orderBy("typeModule.name", dir.toUpperCase() as "ASC" | "DESC");
        } else if (col === "cert_rel.cert_id") {
          qb.orderBy("cert_rel.cert_id", dir.toUpperCase() as "ASC" | "DESC");
        }  else if (col === "subsystem_rel.subsystem_name") {
          qb.orderBy("cert_rel.cert_id", dir.toUpperCase() as "ASC" | "DESC");
        } else {
          qb.orderBy(`pcmstemplate.${col}`, dir.toUpperCase() as "ASC" | "DESC");
        }
      }

      // 🔹 Searching
      if (search) {
      const searchVar = JSON.parse(search);

      for (const key of Object.keys(searchVar)) {
        const value = searchVar[key];
        if (!value) continue;

        // ================= PROJECT SEARCH =================
        if (key === "project_name") {
          const projects = await this._project.find({
            where: {
              project_name: ILike(`%${value}%`),
            },
            select: ["id"],
          });

          const projectIds = projects.map((p) => p.id);

          if (projectIds.length === 0) {
            qb.andWhere("1 = 0"); // force empty result
          } else {
            qb.andWhere("pcmstemplate.project_id IN (:...projectIds)", {
              projectIds,
            });
          }
          continue;
        }

        // ================= COMPANY SEARCH =================
        if (key === "company_name") {
          const companies = await this._Portal_Company.find({
            where: {
              company_name: ILike(`%${value}%`),
            },
            select: ["id_company"],
          });

          const companyIds = companies.map((c) => c.id_company);

          if (companyIds.length === 0) {
            qb.andWhere("1 = 0");
          } else {
            qb.andWhere("pcmstemplate.company_id IN (:...companyIds)", {
              companyIds,
            });
          }
          continue;
        }

        // ================= PROJECT FILTER BY ID (DROPDOWN) =================
        if (key === "project_id") {
          qb.andWhere("pcmstemplate.project_id = :projectId", {
            projectId: Number(value),
          });
          continue;
        }

        // ================= NORMAL COLUMN SEARCH =================
        const column = columnMap[key];
        if (!column) continue;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${value}%`,
        });
      }
    }


      const [data, total] = await qb.skip(skip).take(take).getManyAndCount();

      const projectIds = [
        ...new Set(
          data.map((item) => item.project_id).filter((id) => id && id !== 0)
        ),
      ];

      let projectMap: Record<number, string> = {};
      
      if (projectIds.length > 0) {
        const projects = await this._project.find({
          where: { id: In(projectIds) },
          select: ["id", "project_name"],
        });

        projectMap = projects.reduce((acc, p) => {
          acc[p.id] = p.project_name;
          return acc;
        }, {} as Record<number, string>);
      }

      const companyIds = [
      ...new Set(data.map((item) => item.company_id).filter(Boolean)),
    ];

    let companyMap: Record<number, string> = {};

    if (companyIds.length > 0) {
      const companies = await this._Portal_Company.find({
        where: { id_company: In(companyIds) },
      });

      companyMap = companies.reduce((acc, c) => {
        acc[c.id_company] = c.company_name;
        return acc;
      }, {} as Record<number, string>);
    }

      const result = data.map((v) => ({
        ...v,
        project_name: projectMap[v.project_id] || "Not Set",
        company_name: companyMap[v.company_id] || "Not Set",
      }));

      return {
        data: result,
        total: total,
        page: page,
        limit: take,
        total_pages: Math.ceil(total / take),
      };
    } catch (error) { 
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      }
        throw new InternalServerErrorException('There is an error');
    }
  }




  // -------------- filtered data ----------------

  async getFilterOptions() {
    const disciplines = await this.pcmsTemplateRepo
      .createQueryBuilder('pcmstemplate')
      .leftJoin('pcmstemplate.discipline_tag', 'discipline')
      .select('DISTINCT discipline.discipline_name', 'discipline_name')
      .getRawMany();

    const modules = await this.pcmsTemplateRepo
      .createQueryBuilder('pcmstemplate')
      .leftJoin('pcmstemplate.templates_md', 'templates_md')
      .select('DISTINCT templates_md.mod_desc', 'mod_desc')
      .getRawMany();

    const typeModules = await this.pcmsTemplateRepo
      .createQueryBuilder('pcmstemplate')
      .leftJoin('pcmstemplate.typeModule', 'typeModule')
      .select('DISTINCT typeModule.name', 'name')
      .getRawMany();

    return {
      disciplines: disciplines.map(d => d.discipline_name),
      modules: modules.map(m => m.mod_desc),
      typeModules: typeModules.map(t => t.name),
    };
  }






}
function andWhere(arg0: string) {
  throw new Error('Function not implemented.');
}

function leftJoinAndSelect(arg0: string, arg1: string) {
  throw new Error('Function not implemented.');
}

