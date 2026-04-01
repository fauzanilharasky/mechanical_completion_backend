import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export class AesEcbService {
  decrypt(password: string) {
    throw new Error('Method not implemented.');
  }
  private readonly key: Buffer;
  private readonly algorithm: 'aes-128-ecb' | 'aes-192-ecb' | 'aes-256-ecb';

  constructor(private readonly config: ConfigService) {
    const keyB64 = this.config.get<string>('AES_KEY_B64');
    if (!keyB64) {
      throw new Error('AES_KEY_B64 tidak ditemukan pada environment variables');
    }

    this.key = Buffer.from(keyB64, 'base64');

    if (this.key.length === 16) this.algorithm = 'aes-128-ecb';
    else if (this.key.length === 24) this.algorithm = 'aes-192-ecb';
    else if (this.key.length === 32) this.algorithm = 'aes-256-ecb';
    else {
      throw new Error(
        `Panjang key tidak valid: ${this.key.length} bytes. Harus 16/24/32 bytes.`,
      );
    }
  }

  // Helpers konversi Base64 <-> Base64URL (tanpa padding)
  private toBase64Url(b64: string): string {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  private base64UrlToBase64(b64url: string): string {
    let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4;
    if (pad === 2) b64 += '==';
    else if (pad === 3) b64 += '=';
    else if (pad !== 0) throw new BadRequestException('Ciphertext Base64URL tidak valid');
    return b64;
  }

  // Encrypt: plaintext (utf8) -> AES-ECB/PKCS7 -> Base64URL (tanpa padding)
  encryptToBase64Url(plaintext: string): string {
    try {
      if (typeof plaintext !== 'string' || plaintext.length === 0) {
        throw new BadRequestException('Plaintext tidak boleh kosong');
      }
      const cipher = createCipheriv(this.algorithm, this.key, null);
      cipher.setAutoPadding(true); // PKCS#7

      const ciphertext = Buffer.concat([
        cipher.update(Buffer.from(plaintext, 'utf8')),
        cipher.final(),
      ]);

      const b64 = ciphertext.toString('base64');
      return this.toBase64Url(b64);
    } catch (e) {
      throw new BadRequestException('Gagal mengenkripsi AES-ECB payload');
    }
  }

  // Decrypt: Base64URL -> AES-ECB/PKCS7 -> plaintext (utf8)
  decryptBase64Url(ciphertextB64Url: string): string {
    try {
      const b64 = this.base64UrlToBase64(ciphertextB64Url);
      const ciphertext = Buffer.from(b64, 'base64');

      const decipher = createDecipheriv(this.algorithm, this.key, null);
      decipher.setAutoPadding(true); // PKCS#7

      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch (e) {
      throw new BadRequestException('Gagal mendekripsi AES-ECB payload');
    }
  }
}