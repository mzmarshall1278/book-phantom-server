// src/s3/s3.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    this.s3 = new AWS.S3({
      region: this.configService.get<string>('AWS_REGION'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    });
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME')!;
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const { originalname, buffer } = file;
    const key = `${uuidv4()}-${originalname}`;

    try {
      const result = await this.s3
        .upload({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ACL: 'public-read', // Adjust ACL as needed
        })
        .promise();
      return result.Location;
    } catch (error) {
      this.logger.error('Error uploading to S3:', error);
      throw new Error('Failed to upload image to S3');
    }
  }
}