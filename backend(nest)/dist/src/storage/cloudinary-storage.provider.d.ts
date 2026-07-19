import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage-provider.interface';
export declare class CloudinaryStorageProvider implements StorageProvider {
    private configService;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
}
