import { MasterDiscipline } from "./../master_discipline/master_discipline.entity";
import { MasterPhase } from "./../master_phase/master_phase.entity";
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MasterForm } from "../master_form/master_form.entity";
import { ILike, Repository } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";
import { AesEcbService } from "crypto/aes-ecb.service";
import { portalPermission } from './portal_permissions.entity';
import { portalAppPermission } from "portal_app_permission/portal_app.entity";
import { UpdatePortalAppPermissionDto } from "DTO/dto.update_permissions";

@Injectable()
export class PortalPermissionsService {
    [x: string]: any;
  constructor(
    @InjectRepository(portalPermission, 'portal')
    private readonly PortalPermissionsRepo : Repository<portalPermission>,

    @InjectRepository(portalAppPermission, 'portal')
    private readonly portalAppPermissionRepo: Repository<portalAppPermission>, 
    private readonly aesEcb: AesEcbService
  ) {}


async permissionsGroup(queryDto: ServerSideDTO) {
  try {
    const { sort, search, page, size, id_app_permission } = queryDto;

    // 🛡 SAFE PAGINATION (ANTI OFFSET NEGATIVE)
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(size) || 10);

    const skip = (pageNumber - 1) * pageSize;
    const take = pageSize;

    let dec_id_app_permission: number | null = null;

  
    if (id_app_permission) {
      try {
        dec_id_app_permission = Number(
          this.aesEcb.decryptBase64Url(id_app_permission)
        );

        if (isNaN(dec_id_app_permission)) {
          throw new BadRequestException("Invalid id_app_permission");
        }

      } catch {
        throw new BadRequestException("Invalid id_app_permission");
      }
    }

    const qb = this.PortalPermissionsRepo
      .createQueryBuilder("portalPermission")
      .leftJoinAndSelect("portalPermission.portalApp", "portalApp");

   
    if (dec_id_app_permission) {
      qb.andWhere(
        "portalApp.id_application = :id_application",
        { id_application: dec_id_app_permission }
      );
    }

    const columnMap: Record<string, string> = {
      app_name: "portalApp.app_name",
      permission_name: "portalPermission.permission_name",
      index_key: "portalPermission.index_key",
      permission_group: "portalPermission.permission_group",
      created_date: "portalPermission.created_date",
    };

 
    if (sort) {
      const [col, dir] = sort.split(",");
      const orderColumn = columnMap[col] ?? `portalPermission.${col}`;

      qb.orderBy(
        orderColumn,
        dir?.toUpperCase() === "DESC" ? "DESC" : "ASC"
      );
    } else {
      qb.orderBy("portalPermission.created_date", "DESC");
    }

   
    if (search) {
      const searchVar = JSON.parse(search);

      Object.keys(searchVar).forEach((key) => {
        const column = columnMap[key];
        if (!column) return;

        qb.andWhere(`CAST(${column} AS TEXT) ILIKE :${key}`, {
          [key]: `%${searchVar[key]}%`,
        });
      });
    }

    const [data, total] = await qb
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data,
      total,
      page: pageNumber,
      limit: pageSize,
      total_pages: Math.ceil(total / pageSize),
    };

  } catch (error) {
    console.error("permissionsGroup error:", error);
    throw new InternalServerErrorException(error.message);
  }
}


// CREATE DATA PERMISSIONS

async create(queryDto: ServerSideDTO) {
  try {
    if (!queryDto?.id_app_permission) {
      throw new BadRequestException('Id App Permission is required');
    }

    const decryptedRaw = this.aesEcb.decryptBase64Url(
      queryDto.id_app_permission
    );

    if (!decryptedRaw || !/^\d+$/.test(String(decryptedRaw))) {
      throw new BadRequestException('Invalid id_app_permission');
    }

    const dec_id_app_permission = Number(decryptedRaw);

    console.log(dec_id_app_permission, 'decrypted');

    const portalAppPermission =
      await this.portalAppPermissionRepo.findOne({
        where: { id_application: dec_id_app_permission },
      });

    if (!portalAppPermission) {
      throw new BadRequestException('Portal App Permission not found');
    }

    const lastData = await this.PortalPermissionsRepo
      .createQueryBuilder('p')
      .where('p.id_app_permission = :id', { id: dec_id_app_permission })
      .orderBy('CAST(p.index_key AS INTEGER)', 'DESC')
      .getOne();

    const nextIndex = lastData
      ? String(Number(lastData.index_key) + 1)
      : '0';

    const create = this.PortalPermissionsRepo.create({
      permission_name: queryDto.permission_name,
      permission_group: queryDto.permission_group,
      id_app_permission: dec_id_app_permission,
      index_key: nextIndex,
      created_date: new Date(),
    });

    return await this.PortalPermissionsRepo.save(create);

  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    console.error('PortalPermissionsService.create error:', error);
    throw new InternalServerErrorException(
      'Failed creating portal permission',
    );
  }
}


// EDIT DATA PERMISSIONS

  async findOne(id_permission: string): Promise<portalPermission> {
    const decId = Number(this.aesEcb.decryptBase64Url(id_permission));
    
    const data = await this.PortalPermissionsRepo.findOne({
      where: {id_permission: decId},
    });

    if (!data) {
        throw new NotFoundException('Portal App Permissions Undefined');
      }
    
      return data;
  }


   async update( id_permission: string, updateDto: UpdatePortalAppPermissionDto,): Promise<portalPermission> {
  
      const decId = Number(this.aesEcb.decryptBase64Url(id_permission));
  
      const data = await this.PortalPermissionsRepo.findOne({
        where: { id_permission: decId },
      });
  
      if (!data) {
        throw new NotFoundException('Portal App Permission not found');
      }
  
      await this.PortalPermissionsRepo.update(decId, {
        ...updateDto,
      });
  
      const updated = await this.PortalPermissionsRepo.findOne({
        where: { id_permission: decId },
      });
  
      return updated;
    }

}