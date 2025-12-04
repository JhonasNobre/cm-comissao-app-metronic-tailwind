import { Directive, inject } from '@angular/core';
import { Router } from '@angular/router';
// Services
import { NotificationService } from '../../../core/services/notification.service';
import { TranslocoService } from '@jsverse/transloco';

@Directive()
export abstract class BaseComponent {
    pageTitle = 'Page Title';

    disableControl = false;
    writeAccess = true;
    deleteAccess = true;

    protected router = inject(Router);
    protected notificationService = inject(NotificationService);
    protected translate = inject(TranslocoService);

    /** Toast notifications with PrimeNG MessageService */
    protected showSuccess(msg: string) { this.notificationService.success(msg); }
    protected showError(msg: string) { this.notificationService.error(msg); }
    protected showInfo(msg: string) { this.notificationService.info(msg); }
    protected showWarn(msg: string) { this.notificationService.warn(msg); }
}
