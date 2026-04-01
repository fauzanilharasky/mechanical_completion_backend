import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ServerSideDTO } from "DTO/dto.serverside";
import { PortalUser } from "./portal_user.entity";
import { AesEcbService } from "crypto/aes-ecb.service";
import { UpdateUserDTO } from "DTO/dto.update_profile";
import * as bcrypt from 'bcrypt';
import { CreateUserPermissionDTO } from "DTO/dto.create_permissions";


@Injectable()
export class PortalUserService {
 
  dropdownAssign() {
    throw new Error("Method not implemented.");
  }
  prisma: any;

  constructor(
    @InjectRepository(PortalUser, "portal")
    private readonly PortalUserRepo: Repository<PortalUser>,
    private readonly aesEcb: AesEcbService
  ) {}

  async getDropdownUsers() {
    return this.PortalUserRepo.createQueryBuilder("pud")
      .select([
        "pud.id_user AS id_user",
        "pud.full_name AS full_name",
        "pud.badge_no AS badge_no",
      ])
      .where("pud.status_user = 1") // filter status user aktif
      .getRawMany();
  }

  async findAssignedUsers() {
    return await this.PortalUserRepo.find({
      select: ["id_user", "full_name", "badge_no"],
    });
  }

  remove(id: number): Promise<void> {
    throw new Error("Method not implemented.");
  }

  update(id_itr: number, data: Partial<PortalUser>): Promise<PortalUser> {
    throw new Error("Method not implemented.");
  }

  async findAll(queryDto?: ServerSideDTO): Promise<PortalUser[]> {
    if (queryDto) {
      const res = await this.serverSideList(queryDto);
    }
    return this.PortalUserRepo.find();
  }
  create(data: Partial<PortalUser>, userId: any): any {
    throw new Error("Method not implemented.");
  }


  // UPDATE PROFILE ACCOUNT

   async updateUser(id: number, data: UpdateUserDTO) {
    const user = await this.PortalUserRepo.findOne({
      where: { id_user: id } as any,
    });

    if (!user) {
      throw new NotFoundException('Undefined data User');
    }

    // update field biasa
    if (data.full_name) user.full_name = data.full_name;
    if (data.email) user.email = data.email;

    // kalau ada password → hash dulu
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(data.password, salt);
    }

    await this.PortalUserRepo.save(user);

    return {
      message: 'Successfuly to Update User',
    };
  }





  // UPDATE ACCOUNT 
async updateAccount(
  id_user: string,
  data: Partial<PortalUser>,
  userId: number,
): Promise<PortalUser> {

  let decId: number;

  // decrypt ID
  try {
    decId = Number(this.aesEcb.decryptBase64Url(id_user));
  } catch {
    decId = Number(id_user);
  }


  const oldData = await this.PortalUserRepo.findOne({
    where: { id_user: decId },
  });

  if (!oldData) {
    throw new NotFoundException('Portal User Undefined');
  }

  const { password, id_role, ...restData } = data;

  const updatedData: PortalUser = {
    ...oldData,
    ...restData,
    id_role: id_role ? Number(id_role) : oldData.id_role,
    update_by: userId,
    last_update: new Date(),
  };

  if (password && password.trim() !== '') {
    updatedData.password = await bcrypt.hash(data.password, 10);
  }

  await this.PortalUserRepo.save(updatedData);

  return updatedData;
}




// PROFILE ACCOUNT
async findById(id: number): Promise<PortalUser> {
  const user = await this.PortalUserRepo.findOne({
    where: { id_user: id } as any,
  });

  if (!user) {
    throw new NotFoundException('User tidak ditemukan');
  }

  return user;
}


// UPDATE PROFILE ACCOUNT

  async findOne(id: number): Promise<PortalUser> {
    const user = await this.PortalUserRepo.findOne({
      where: { id_user: Number(id) } as any,
    });
    if (!user)
      throw new NotFoundException(`PortalUser with id ${id} not found`);
    return user;
  }

  

  async serverSideList(queryDto: ServerSideDTO) {
    const page = Number(queryDto.page) > 0 ? Number(queryDto.page) : 1;
    const size = Number(queryDto.size) > 0 ? Number(queryDto.size) : 10;
    const skip = (page - 1) * size;

    const [items, total] = await this.PortalUserRepo.findAndCount({
      skip,
      take: size,
    });

    return { items, total, page, size };
  }


  // GET DATA - TO EDIT DATA PORTAL USER
  async getEditData(id_user: string): Promise<PortalUser> {
    const decId = Number(this.aesEcb.decryptBase64Url(id_user));
  
    const data = await this.PortalUserRepo.findOne({
      where: { id_user: decId },
    });
  
    if (!data) {
      throw new NotFoundException('Portal User Undefined');
    }
  
    return data;
  }
  
  


  // PORTAL USER LIST 

 async getListUser(queryDto: ServerSideDTO) {
  try {
    const { sort, page = 1, size = 10, ...filters } = queryDto;

    const skip = (page - 1) * size;

    const qb = this.PortalUserRepo.createQueryBuilder("user");

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        qb.andWhere(`LOWER(user.${key}) LIKE LOWER(:${key})`, {
          [key]: `%${filters[key]}%`,
        });
      }
    });


    if (sort) {
      const [col, dir] = sort.split(",");
      qb.orderBy(`user.${col}`, dir.toUpperCase() as "ASC" | "DESC");
    } else {
      qb.orderBy("user.id_user", "DESC");
    }

    qb.skip(skip).take(size);

    const [data, total] = await qb.getManyAndCount();

    return {
      content: data,
      total,
      pageIndex: page,
      size,
      totalPages: Math.ceil(total / size),
    };

  } catch (error) {
    if (error instanceof Error) {
      throw new InternalServerErrorException(error.message);
    }
    throw new InternalServerErrorException("There is an error");
  }
}

  

  // --------------- CREATE ACCOUNT USER -----------------
  async createUser(data: CreateUserPermissionDTO) {
  try {
    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const dataForm = {
      ...data,
      // id_user: undefined,
      password: hashedPassword,
      status_user: 1,
      created_date: new Date(),
    };

    const form = this.PortalUserRepo.create(dataForm);
    return await this.PortalUserRepo.save(form);

  } catch (error) {
    console.error("CREATE USER ERROR:", error); // 🔥 wajib
    throw new InternalServerErrorException(error.message);
  }
}


  // ---------------- REGISTER ACCOUNT --------------- 
   async registerAccount(data: Partial<PortalUser>): Promise<PortalUser> {
      try {
       
        const dataForm = {
           ...data,
          status_user: 1,
          created_date: new Date(),
          };
  
       
        const form = this.PortalUserRepo.create(dataForm);
        return await this.PortalUserRepo.save(form);
  
      }catch (error) {  if (error instanceof Error) {
          throw new InternalServerErrorException(error.message);
        }
          throw new InternalServerErrorException('There is an error');
      }
    }


}
