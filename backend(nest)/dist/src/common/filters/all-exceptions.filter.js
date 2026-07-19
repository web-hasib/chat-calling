"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const resContent = exception.getResponse();
            message = typeof resContent === 'object' ? resContent.message || exception.message : resContent;
        }
        else if (exception?.code) {
            status = common_1.HttpStatus.BAD_REQUEST;
            switch (exception.code) {
                case 'P2002': {
                    const target = exception.meta?.target ? ` (${exception.meta.target.join(', ')})` : '';
                    message = `Unique constraint failed: A record with this value already exists${target}.`;
                    break;
                }
                case 'P2003': {
                    message = 'Foreign key constraint failed: Related record not found.';
                    break;
                }
                case 'P2025': {
                    message = 'Record to update or delete not found.';
                    break;
                }
                default: {
                    status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                    message = exception.message || 'Database error occurred.';
                }
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        console.error(`[Exception] Path: ${request.url} | Status: ${status} | Message: ${message}`);
        if (exception && !(exception instanceof common_1.HttpException)) {
            console.error(exception.stack || exception);
        }
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: Array.isArray(message) ? message[0] : message,
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map