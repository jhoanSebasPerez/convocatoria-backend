import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { BadRequestException, Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {

    private readonly s3: S3Client;
    private readonly bucketName = process.env.AWS_S3_BUCKET;
    private readonly AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT;

    constructor() {
        this.s3 = new S3Client({
            region: process.env.AWS_REGION ?? "us-east-1",
            endpoint: this.AWS_S3_ENDPOINT,
            forcePathStyle: true,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
            },
        });
    }

    private formatFileName(fileName: string): string {
        return fileName
            .normalize("NFD") // Descompone caracteres acentuados y combinados
            .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos (acentos, tildes)
            .replace(/ñ|Ñ/g, match => (match === "ñ" ? "n" : "N")) // Reemplaza ñ y Ñ correctamente
            .replace(/\s+/g, "_") // Reemplaza espacios con "_"
            .replace(/[^\w.-]/g, ""); // Remueve caracteres especiales excepto letras, números, guiones y puntos
    };

    async uploadFile(file: Express.Multer.File) {
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 🔹 2MB en bytes
        const ALLOWED_MIME_TYPES = [
            "application/pdf", // PDF
            "application/msword", // DOC
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // DOCX
        ];

        // ✅ Validar el tipo de archivo
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException("Formato de archivo no permitido. Solo se aceptan PDF y Word.");
        }

        // ✅ Verificar tamaño antes de subir a S3
        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException("El archivo supera el límite de 2MB.");
        }

        const formatFilename = this.formatFileName(file.originalname);
        const fileName = `${uuidv4()}-${formatFilename.toLocaleLowerCase()}`;
        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });

        await this.s3.send(command);

        return `${this.AWS_S3_ENDPOINT}/${this.bucketName}/${fileName}`;
    }
}