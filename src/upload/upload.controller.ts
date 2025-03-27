import { Controller, Get, Logger, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { S3Service } from "./s3.service";

@Controller("upload")
export class UploadController {

    private readonly logger = new Logger(UploadController.name);

    constructor(private readonly s3Service: S3Service) { }

    @Post()
    @UseInterceptors(FileInterceptor("file"))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        this.logger.log(`Uploading file ${file.originalname}`);
        const fileUrl = await this.s3Service.uploadFile(file);
        return { url: fileUrl };
    }
}

