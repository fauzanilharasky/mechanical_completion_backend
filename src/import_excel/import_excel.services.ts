import * as XLSX from "xlsx";
import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { PcmsMcTemplate } from "pcms_mc_template/pcms_template.entity";
import { DataSource, Repository} from "typeorm";
import { error } from "console";
import { MasterDiscipline } from "master_discipline/master_discipline.entity";
import { Subsystem } from "master_subsystem/subsystem.entity";
import { MasterModule } from "master_module/master_module.entity";
import { MasterTypeModule } from "master_typemodule/master_typemodule.entity";
import { PortalProject } from "portal_project/portal_project.entity";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { MasterSystem } from "master_system/master_system.entity";
import { MasterForm } from "master_form/master_form.entity";

@Injectable()
export class ImportExcelService {

  constructor (
     @InjectDataSource() // default DB
    private readonly dataSource: DataSource,

     @InjectRepository(PortalProject, 'portal')
    private repo: Repository<PortalProject>,

    @InjectDataSource("portal") // portal DB
    private readonly portalDataSource: DataSource,

    @InjectRepository(Subsystem)
    private readonly subsystemRepo: Repository<Subsystem>,

  ) {}


  private tempData = new Map<string, any[]>();
  

  //  ----------------- Upload Data ------------

  async handleUpload(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      throw new BadRequestException("Excel file is empty");
    }





    // ------------- RELATION DATA MAPPING --------------
    
    const projectRepo = this.portalDataSource.getRepository(PortalProject);
    const portalProjects = await projectRepo.find();

    const disciplineRepo = this.dataSource.getRepository(MasterDiscipline);
    const masterDisciplines = await disciplineRepo.find();

    const systemsRepo = this.dataSource.getRepository(MasterSystem);
    const masterSystems = await systemsRepo.find();

    const formRepo = this.dataSource.getRepository(MasterForm);
    const masterForms = await formRepo.find();

    const subsytemRepo = this.dataSource.getRepository(Subsystem);
    const masterSubsystems = await subsytemRepo.find();

    const moduleRepo = this.dataSource.getRepository(MasterModule);
    const masterModules = await moduleRepo.find();

    const typeModuleRepo = this.dataSource.getRepository(MasterTypeModule);
    const masterTypeModule= await typeModuleRepo.find();


 
    

    // ---------------- MAPPING DATA -------------------
    const projectMap = new Map(
     portalProjects.map(p => [
        p.project_name?.toLowerCase().trim(),
        p.id
      ])
    );


    const disciplineMap = new Map(
      masterDisciplines.map(d => [
        d.discipline_name?.toLowerCase().trim(),
        d.id
      ])
    );

    const systemsMap = new Map(
      masterSystems.map(s => [
        s.system_name?.toLowerCase().trim(),
        s.id
      ])
    );

    const certMap = new Map(
      masterForms.map(s => [
        s.cert_id?.toLowerCase().trim(),
        s.id
      ])
    );
    
    const subsytemMap = new Map(
      masterSubsystems.map(s => [
        s.subsystem_name?.toLowerCase().trim(),
        s.id
      ])
    );

    const moduleMap = new Map(
      masterModules.map(m => [
        m.mod_desc?.toLowerCase().trim(),
        m.mod_id
      ])
    );

    const typeModuleMap = new Map(
      masterTypeModule.map(t => [
        t.name?.toLowerCase().trim(),
        t.id
      ])
    );


    // CHECK DUPLICATE DATA TAG_NUMBER
    const tagCounter = new Map<string, number>();

    rows.forEach((row: any) => {
      const tag = row["Tag Number"]?.toString().trim().toLowerCase();
      if (!tag) return;

      tagCounter.set(tag, (tagCounter.get(tag) || 0) + 1);
    });





    // -------------- PREVIEW DATA ----------------

    const preview = rows.map((row: any, index: number) => {
      const errors: string[] = [];

      if (!row["Tag Number"]) {
        errors.push("Tag Number is required");
      }

      const tagNumber = row["Tag Number"]?.toString().trim();
      const normalizedTag = tagNumber?.toLowerCase();

      if (tagCounter.get(normalizedTag) > 1) {
        errors.push("Duplicate Tag Number in uploaded file");
      }


      // ---------- PROJECTS --------------
      const projectName = row["Project Name "]?.toString().trim();
      const projectId = projectMap.get(projectName?.toLowerCase());

      if (!projectId) {
        errors.push(`Project Name '${projectName}' not found`);
      }

      //----------- discipline ------------
      const disciplineName = row["Discipline"]?.toString().trim();
      const disciplineId = disciplineMap.get(disciplineName?.toLowerCase());

      if (!disciplineId) {
        errors.push(`Discipline '${disciplineName}' not found`);
      }

      // ------------- System --------------
      const systemName = row["System"]?.toString().trim();
      const systemId = systemsMap.get(systemName?.toLowerCase());

      if (!systemId) {
        errors.push(`System '${systemName}' not found`);
      }

       const certName = row["Cert ID"]?.toString().trim();
      const certId = certMap.get(certName?.toLowerCase());

      if (!certId) {
        errors.push(`Cert ID '${certName}' not found`);
      }


      // ------------- subsystem ------------
       const subsystemName = row["Subsystem"]?.toString().trim();
      const subsystemId = subsytemMap.get(subsystemName?.toLowerCase());

      if (!subsystemId) {
        errors.push(`Subsystem '${subsystemName}' not found`);
      }

      
      // ------------- module -------------
      const moduleName = row["Module"]?.toString().trim();
      const modId = moduleMap.get(moduleName?.toLowerCase());

      if (!modId) {
        errors.push(`Module '${moduleName}' not found`);
      }

      // ------------- TYPE OF MODULE -------------
      const typeModuleName = row["Type Of Module"]?.toString().trim();
      const typeModuleId = typeModuleMap.get(typeModuleName?.toLowerCase());

      if (!typeModuleId) {
        errors.push(`Type Of Module '${typeModuleName}' not found`);
      }




      return {
        no: index + 1,
        // ------------ relasi data ---------- 
        project_name: projectName,
        discipline_name: disciplineName,
        module_desc: moduleName,
        type_module_name: typeModuleName,
        
        drawing_no: row["Drawing No"],
        cert_id: certName,
        event_id: row["Event ID"],
        tag_number: row["Tag Number"],
        tag_description: row["Tag Description"],
        system_name: systemName,
        subsystem_name: subsystemName,
        // subsystem_description: row["Subsystem Desc"],
        phase: row["Phase"],
        location: row["Location"],
        model_no: row["No model"],
        serial_no: row["Serial No"],
        rating: row["Rating"],
        manufacturer: row["Manufacturer"],
        remarks: row["Remarks"],
        status: row["Status"],
        _ids: {
          project_id: projectId,
          discipline_id: disciplineId,
          subsystem_id: subsystemId,
          module_id: modId,
          cert_id: certId,
          typeModule_id: typeModuleId,
          system_id: systemId,
        },
        valid: errors.length === 0,
        message: errors.join(", "),
      };
    });

    const sessionId = uuidv4();
    this.tempData.set(sessionId, preview);

    return {
      sessionId,
      total: preview.length,
      valid: preview.filter(p => p.valid).length,
      preview,
    };
  }


   getPreview(sessionId: string) {
    return this.tempData.get(sessionId) || [];
  }



  // ------------------ HELPER FUNCTION -----------------
  private cleanString(value: any, upperCase = false) {
  if (typeof value !== "string") return value;

  let cleaned = value.trim(); // hapus spasi depan belakang
  cleaned = cleaned.replace(/\s+/g, " "); 

  if (cleaned === "") return null;

  if (upperCase) {
    cleaned = cleaned.toUpperCase();
  }

  return cleaned;
}

private cleanObject(obj: any) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      key,
      typeof value === "string"
        ? this.cleanString(value)
        : value,
    ])
  );
}

// ----------------- IMPORT SAVED DATA ----------------------

async saveImportedData(userId: any, sessionId: string) {
  const data = this.tempData.get(sessionId);

  if (!data || !data.length) {
    throw new InternalServerErrorException("No data to import");
  }

  const validRows = data.filter((d) => d.valid);

  if (!validRows.length) {
    throw new InternalServerErrorException("No valid data to save");
  }

  try {
    await this.dataSource.transaction(async (manager) => {

      const payload = await Promise.all(
    validRows.map(async (row) => {

      const cleanedRow = this.cleanObject(row);

      const _subsystem = await this.subsystemRepo.findOne({
        where: { id: cleanedRow._ids.subsystem_id }
      });

        return {
          // ========= RELATION ==========
          project_id: cleanedRow._ids.project_id,
          discipline: cleanedRow._ids.discipline_id,
          module: cleanedRow._ids.module_id,
          type_of_module: cleanedRow._ids.typeModule_id,
          cert_id: cleanedRow._ids.cert_id,
          system: cleanedRow._ids.system_id,
          subsystem: cleanedRow._ids.subsystem_id,

          // ========= DATA ==========
          drawing_no: this.cleanString(cleanedRow.drawing_no),
          event_id: this.cleanString(cleanedRow.event_id),
          tag_number: this.cleanString(cleanedRow.tag_number, true), // AUTO UPPERCASE
          tag_description: this.cleanString(cleanedRow.tag_description),
          subsystem_description: this.cleanString(_subsystem.subsystem_description),
          phase: this.cleanString(cleanedRow.phase),
          location: this.cleanString(cleanedRow.location),
          model_no: this.cleanString(cleanedRow.model_no),
          serial_no: this.cleanString(cleanedRow.serial_no),
          rating: this.cleanString(cleanedRow.rating),
          manufacturer: this.cleanString(cleanedRow.manufacturer),
          remarks: this.cleanString(cleanedRow.remarks),
          status: this.cleanString(cleanedRow.status),

          created_by: userId,
          created_date: new Date(),
        };
      }));

      await manager
        .createQueryBuilder()
        .insert()
        .into(PcmsMcTemplate)
        .values(payload)
        .execute();
    });

    this.tempData.delete(sessionId);

    return {
      message: "Data imported successfully",
      total: validRows.length,
    };

  } catch (error) {
    throw new InternalServerErrorException(error.message);
  }
}




  // ------------------ GENERATE TEMPLATE -----------------

  async generateTemplate() {
    const headers = [
      [
        "Project Name",
        "Discipline",
        "Module",
        "Type Of Module",
        "Drawing No",
        "Cert ID",
        "Event ID",
        "Tag Number",
        "Tag Description",
        "System",
        "Subsystem",
        "Subsystem Desc",
        "Phase",
        "Location",
        "No model",
        "Serial No",
        "Rating",
        "Manufacturer",
        "Remarks",
        "Status",
      ],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const filename = "import_template.xlsx";
    XLSX.writeFile(workbook, filename);

    return { path: filename, name: filename };
  }


  async getResultFile(sessionId: string) {
    const data = this.tempData.get(sessionId) || [];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Result");

    const filename = `import_result_${sessionId}.xlsx`;
    XLSX.writeFile(workbook, filename);

    return { path: filename, name: filename };
  }
}