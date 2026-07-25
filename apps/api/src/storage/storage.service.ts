import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET') || 'recipes';
    this.publicUrl = (config.get<string>('S3_PUBLIC_URL') || 'http://localhost:9000').replace(/\/+$/, '');
    this.client = new S3Client({
      endpoint: config.get<string>('S3_ENDPOINT') || 'http://localhost:9000',
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.get<string>('S3_ACCESS_KEY') || 'minioadmin',
        secretAccessKey: config.get<string>('S3_SECRET_KEY') || 'minioadmin',
      },
    });
  }

  async onModuleInit() {
    try {
      await this.ensureBucket();
    } catch (error) {
      this.logger.error(`S3 bucket check failed: ${(error as Error).message}`);
    }
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return;
    } catch {
      // bucket is missing — create it below
    }
    await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      }),
    );
    this.logger.log(`Created public-read bucket "${this.bucket}"`);
  }

  publicUrlPrefix(): string {
    return `${this.publicUrl}/${this.bucket}/`;
  }

  async uploadObject(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );
    return `${this.publicUrlPrefix()}${key}`;
  }

  // Best-effort: silently ignores URLs from other origins (e.g. legacy /uploads/... values)
  async deleteObjectByUrl(url: string | null | undefined): Promise<void> {
    if (!url || !url.startsWith(this.publicUrlPrefix())) return;
    const key = url.slice(this.publicUrlPrefix().length);
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      this.logger.warn(`Failed to delete object ${key}: ${(error as Error).message}`);
    }
  }
}
