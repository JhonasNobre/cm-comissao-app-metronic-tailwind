import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SuporteService } from '../../core/services/suporte.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: '[app-header]',
  templateUrl: './header.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private suporteService = inject(SuporteService);
  private messageService = inject(MessageService);

  userName: string = 'Usuário';
  userEmail: string = '';
  userAvatar: string = 'assets/media/avatars/300-2.png'; // Default avatar

  // Support Ticket State
  isSupportVisible: boolean = false;
  supportName: string = '';
  supportPhone: string = '';
  supportTitle: string = '';
  supportMessage: string = '';
  supportFile?: File;
  sendingSupport: boolean = false;

  ngOnInit(): void {
    this.loadUserInfo();
  }

  private loadUserInfo(): void {
    if (this.authService.isAuthenticated()) {
      const claims = this.authService.getUserInfo();
      if (claims) {
        this.userName = claims.name || claims.preferred_username || 'Usuário';
        this.userEmail = claims.email || '';
        // Pre-fill support name if available
        this.supportName = this.userName;
      }
    }
  }

  openSupport() {
    this.isSupportVisible = true;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.messageService.add({ severity: 'warn', summary: 'Arquivo muito grande', detail: 'O arquivo excede o limite de 5MB.' });
        event.target.value = '';
        this.supportFile = undefined;
        return;
      }
      this.supportFile = file;
    } else {
      this.supportFile = undefined;
    }
  }

  sendSupportRequest() {
    if (!this.supportName || !this.supportTitle || !this.supportMessage) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }

    this.sendingSupport = true;
    const request = {
      nome: this.supportName,
      telefone: this.supportPhone,
      titulo: this.supportTitle,
      mensagem: this.supportMessage,
      arquivo: this.supportFile
    };

    this.suporteService.abrirChamado(request).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Sua mensagem foi enviada com sucesso!' });
        this.isSupportVisible = false;
        this.sendingSupport = false;
        // Reset non-user fields
        this.supportTitle = '';
        this.supportMessage = '';
        this.supportFile = undefined;
      },
      error: (err) => {
        console.error('Erro ao enviar chamado', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível enviar sua mensagem. Tente novamente.' });
        this.sendingSupport = false;
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
