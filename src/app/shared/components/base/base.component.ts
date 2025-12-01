import { Directive, inject } from '@angular/core';
import { Router } from '@angular/router';
// Models
import { Session } from '../../models/common/session.model';
// Services
import { NotificationService } from '../../../core/services/notification.service';
import { UserRouteService } from '../../../features/config/user/user-route/user-route.service';
import { SessionStoreService } from '../../services/session-store.service';

@Directive()
export abstract class BaseComponent {
    pageTitle = 'Page Title';

    session: Session | null = null;
    disableControl = false;
    writeAccess = true;
    deleteAccess = true;

    protected router = inject(Router);
    protected sessionStoreService = inject(SessionStoreService);
    protected notificationService = inject(NotificationService);
    protected userRouteService = inject(UserRouteService);

    ngOnInit(): void {
        this.sessionStoreService.session$.subscribe(s => {
            if (s) {
                this.session = s
            } else {
                this.session = new Session();
            }
        });
    }

    /** Toast notifications with PrimeNG MessageService */
    protected showSuccess(msg: string) { this.notificationService.success(msg); }
    protected showError(msg: string) { this.notificationService.error(msg); }
    protected showInfo(msg: string) { this.notificationService.info(msg); }
    protected showWarn(msg: string) { this.notificationService.warn(msg); }
}
