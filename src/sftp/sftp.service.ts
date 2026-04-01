import { Injectable } from '@nestjs/common';
const SftpClient = require('ssh2-sftp-client');

@Injectable()
export class SftpService {
  private sftp = new SftpClient();

  async uploadFile(localPath: string, remotePath: string) {
    const config = {
      host: process.env.FTP_SINOLOGI_HOST,
      port: 22,
      username: process.env.FTP_SINOLOGI_USER,
      password: process.env.FTP_SINOLOGI_PASS,
    };
    console.log(config);
    try {
      await this.sftp.connect(config);
      await this.sftp.put(localPath, remotePath);
      await this.sftp.end();
      return { success: true, message: 'File uploaded successfully' };
    } catch (err) {
      await this.sftp.end();
      throw err;
    }
  }
}
