// src/crypto/crypto.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AesEcbService } from './aes-ecb.service';

@Module({
  imports: [ConfigModule],
  providers: [AesEcbService],
  exports: [AesEcbService],
})
export class CryptoModule {}