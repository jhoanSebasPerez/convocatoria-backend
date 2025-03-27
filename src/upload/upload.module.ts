import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { S3Service } from './s3.service';

@Module({
    providers: [
        S3Service
    ],
    controllers: [UploadController]
})
export class UploadModule { }
