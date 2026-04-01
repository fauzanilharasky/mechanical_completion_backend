import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User, 'portal') private readonly _user: Repository<User>,
  ) {}

  async findAll() {
    try {
      return this._user.find();
    } catch (error) {
      throw new Error(error);
    }
  }
}
