import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { SftpService } from './sftp.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

@Controller('api/sftp')
export class SftpController {
  constructor(private readonly _sftp: SftpService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: path.join(__dirname, 'uploads'),
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
      },
    }),
  }))
  async upload(@UploadedFile() file) {
    const localPath = file.path;
    const remotePath = `/PCMS/mc_punch/${file.filename}`;
    return this._sftp.uploadFile(localPath, remotePath);
  }
}
