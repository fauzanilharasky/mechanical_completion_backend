import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { portalAppPermission } from './portal_app.entity';
import { Repository } from 'typeorm';
import { AesEcbService } from 'crypto/aes-ecb.service';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { UpdatePortalAppPermissionDto } from 'DTO/dto.update_permissions';

@Injectable()
export class PortalAppPermissionService {
    constructor(
        @InjectRepository(portalAppPermission, 'portal')
        private readonly _portalAppPermission: Repository<portalAppPermission>, 
        private readonly aesEcb: AesEcbService,
    
      ) { }

       async findAll(query: any) {
      
            const page = Number(query.page ?? 1);
            const size = Number(query.size ?? 10);
            const skip = (page - 1) * size;
      
            const qb = this._portalAppPermission.createQueryBuilder("app_permission");
      
      
            // ================= SEARCH =================
            if (query.app_name) {
              qb.andWhere(
                "CAST(app_permission.app_name AS TEXT) ILIKE :app_name",
                { app_name: `%${query.app_name}%` }
              );
            }
      
            if (query.created_date) {
              qb.andWhere(
                "CAST(app_permission.created_date AS TEXT) ILIKE :created_date",
                { created_date: `%${query.created_date}%` }
              );
            }
           
    
      
              // ================= SORTING =================
          if (query.sort) {
            const [column, direction] = query.sort.split(",");
            qb.orderBy(`app_permission.${column}`, direction.toUpperCase() === "DESC" ? "DESC" : "ASC");
          } else {
            qb.orderBy("app_permission.id_application", "DESC");
          }
      
          // ================= PAGINATION =================
          qb.skip(skip).take(size);
      
          const [data, total] = await qb.getManyAndCount();
      
      
            return {
              content: data,
              totalElements: total,
              totalPages: Math.ceil(total / size),
            };
        }



        // CREATE DATA PERMISSIONS
    async createPermissions( data: Partial<portalAppPermission>): Promise<portalAppPermission> {
    try {

        const dataForm = {
        ...data,
        created_date: new Date(),
        };

        const form = this._portalAppPermission.create(dataForm);
        return await this._portalAppPermission.save(form);

    } catch (error) {
        if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
        }
        throw new InternalServerErrorException('There is an error');
    }
    }
    
    // GET EDIT DATA PERMISSIONS
    
      async findOne(id_application: string): Promise<portalAppPermission> {
      const decId = Number(this.aesEcb.decryptBase64Url(id_application));
    
      const data = await this._portalAppPermission.findOne({
        where: { id_application: decId },
      });
    
      if (!data) {
        throw new NotFoundException('Portal App Permissions Undefined');
      }
    
      return data;
    }



    //  PUT EDIT DATA PERMISSIONS
    async update( id_application: string, updateDto: UpdatePortalAppPermissionDto,): Promise<portalAppPermission> {

    const decId = Number(this.aesEcb.decryptBase64Url(id_application));

    const data = await this._portalAppPermission.findOne({
      where: { id_application: decId },
    });

    if (!data) {
      throw new NotFoundException('Portal App Permission not found');
    }

    await this._portalAppPermission.update(decId, {
      ...updateDto,
    });

    const updated = await this._portalAppPermission.findOne({
      where: { id_application: decId },
    });

    return updated;
  }


      // CHECKBOX USER PERMISSION

      async getAll() {
    return await this._portalAppPermission.find({
      relations: ['permissions'],
      order: {
        id_application: 'ASC',
        permissions: {
          id_permission: 'ASC',
        },
      },
    });
  }
    
}