import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Confirmation, ConfirmationService as PrimeConfirmationService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppConfirmationService {
  private primeConfirmation = inject(PrimeConfirmationService);
  private transloco = inject(TranslocoService);

  /**
* MUDANÇA: Um novo método genérico para qualquer tipo de confirmação.
   * Usa padrões neutros que podem ser sobrescritos.
   */
  confirm(config: Partial<Confirmation>): Promise<boolean> {
    return new Promise((resolve) => {
      this.primeConfirmation.confirm({
        // Padrões genéricos
        header: 'Confirmação',
        icon: 'pi pi-question-circle',
        acceptLabel: 'Sim',
        rejectLabel: 'Não',
        acceptButtonStyleClass: 'p-button-info',
        rejectButtonStyleClass: 'p-button-text',

          // Sobrescreve os padrões com a configuração passada
        ...config,

        // Lida com a resolução da Promise
        accept: () => {
          config?.accept?.();
          resolve(true);
        },
        reject: () => {
          config?.reject?.();
          resolve(false);
        }
      });
    });
  }

  /**
   * MUDANÇA: O método de exclusão agora simplesmente chama o método genérico
     * com suas próprias configurações padrão para exclusão.
   */
  async confirmDelete(config?: Partial<Confirmation> & { data?: any }): Promise<boolean> {
    const translatedMessage = await firstValueFrom(
      this.transloco.selectTranslate('general.phrase.sure_delete_item', { item: config?.data?.item || '' })
    );

    const translatedHeader = await firstValueFrom(
      this.transloco.selectTranslate('general.phrase.delete_confirmation_header')
    );

    const acceptLabel = await firstValueFrom(
      this.transloco.selectTranslate('general.singular.exclude')
    );

    const rejectLabel = await firstValueFrom(
      this.transloco.selectTranslate('general.singular.cancel')
    );

    return this.confirm({
      message: translatedMessage,
      header: translatedHeader,
      icon: 'pi pi-exclamation-triangle',
       acceptLabel: acceptLabel,
       rejectLabel: rejectLabel,
      acceptButtonStyleClass: 'p-button-danger',
      ...config,
    });
  }
}
