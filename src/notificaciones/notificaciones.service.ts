import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Novu } from '@novu/api';
import { User } from '@prisma/client';

@Injectable()
export class NotificationService {
    private readonly novu: Novu;

    constructor(
        private readonly configService: ConfigService
    ) {
        const novuApiKey = this.configService.get('NOVU_API_KEY');
        this.novu = new Novu({
            secretKey: novuApiKey
        });
    }

    async enviarNotificacion({
        user, title, message, actionUrl
    }: { user: { id: string, fullname: string, email: any }, title: string, message: string, actionUrl: string }) {
        const firstName = user.fullname ? user.fullname.split(' ')[0] : '';
        const lastName = user.fullname ? user.fullname.split(' ')[1] : '';
        try {
            await this.novu.trigger({
                workflowId: 'convocatoria-in-app-notification',
                to: {
                    subscriberId: user.id,
                    email: user.email,
                    firstName,
                    lastName
                },
                payload: {
                    mensajeNotificacion: message,
                    tituloProyecto: title,
                    urlAccion: `${this.configService.get('FRONTEND_URL')}${actionUrl}`
                },
                overrides: {
                    email: {
                        senderName: "Convocatoria UFPS"
                    }
                }
            });

        } catch (error) {
            console.error("❌ Error enviando la notificación:", error);
        }
    }

    async enviarEmailCreacionDocente(token: string, docente: User) {
        const firstName = docente.fullname ? docente.fullname.split(' ')[0] : '';
        const lastName = docente.fullname ? docente.fullname.split(' ')[1] : '';

        await this.novu.trigger({
            workflowId: 'convocatoria-create-docente',
            to: {
                subscriberId: docente.id,
                email: docente.email,
                firstName: firstName,
                lastName: lastName
            },
            payload: {
                fullname: docente.fullname,
                activate_url: `${this.configService.get('FRONTEND_URL')}/activar-cuenta/${token}`
            },
            overrides: {
                email: {
                    senderName: "Convocatoria UFPS"
                }
            }
        });
    }

    async enviarEmailCreacionEstudiante(user: User, token: string) {
        const firstName = user.fullname ? user.fullname.split(' ')[0] : '';
        const lastName = user.fullname ? user.fullname.split(' ')[1] : '';

        await this.novu.trigger({
            workflowId: 'convocatoria-registration-user',
            to: {
                subscriberId: user.id,
                email: user.email,
                firstName: firstName,
                lastName: lastName
            },
            payload: {
                fullname: user.fullname,
                verification_link: `${this.configService.get('FRONTEND_URL')}/verify/${token}`
            },
            overrides: {
                email: {
                    senderName: "Convocatoria UFPS"
                }
            }
        });
    }

}