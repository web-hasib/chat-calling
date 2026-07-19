"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_storage_provider_1 = require("./cloudinary-storage.provider");
const s3_storage_provider_1 = require("./s3-storage.provider");
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: 'StorageProvider',
                useFactory: (configService) => {
                    const provider = configService.get('STORAGE_PROVIDER', 'cloudinary');
                    if (provider === 's3') {
                        return new s3_storage_provider_1.S3StorageProvider(configService);
                    }
                    return new cloudinary_storage_provider_1.CloudinaryStorageProvider(configService);
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: ['StorageProvider'],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map