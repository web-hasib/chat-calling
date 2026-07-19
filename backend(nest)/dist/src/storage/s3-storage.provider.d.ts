import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage-provider.interface';
export declare class S3StorageProvider implements StorageProvider {
    private configService;
    private s3Client;
    private bucketName;
    private region;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
}
