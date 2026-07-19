"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
let S3StorageProvider = class S3StorageProvider {
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.get('AWS_REGION') ?? 'us-east-1';
        this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME') ?? '';
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID') ?? '';
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY') ?? '';
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: { accessKeyId, secretAccessKey },
        });
    }
    async uploadFile(file) {
        const fileKey = `${Date.now()}-${file.originalname}`;
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileKey,
            Body: file.buffer,
            ContentType: file.mimetype,
        }));
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
    }
    async deleteFile(fileUrl) {
        const key = fileUrl.split('/').pop();
        if (!key)
            return;
        await this.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
    }
};
exports.S3StorageProvider = S3StorageProvider;
exports.S3StorageProvider = S3StorageProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3StorageProvider);
//# sourceMappingURL=s3-storage.provider.js.map