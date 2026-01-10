import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { TabsModule } from 'primeng/tabs';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ImobtechConfigurationService } from '../../services/imobtech-configuration.service';
import { ImobtechConfiguration, ImobtechConfigurationResponse, ModoImobtech } from '../../models/imobtech-configuration.model';

@Component({
    selector: 'app-configuration-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        CardModule,
        ToastModule,
        CheckboxModule,
        TabsModule,
        Select
    ],
    providers: [MessageService],
    templateUrl: './configuration-form.component.html'
})
export class ConfigurationFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(ImobtechConfigurationService);
    private messageService = inject(MessageService);
    private router = inject(Router);

    form!: FormGroup;
    loading = false;

    modoOptions = [
        { label: 'Homologação', value: ModoImobtech.Homologacao },
        { label: 'Produção', value: ModoImobtech.Producao }
    ];

    ngOnInit(): void {
        this.initForm();
        this.loadConfiguration();
    }

    private initForm(): void {
        this.form = this.fb.group({
            habilitado: [false],
            modo: [ModoImobtech.Homologacao],
            clientId: [''],
            clientSecret: [''],
            username: [''],
            password: ['']
        });

        // Validadores condicionais
        this.form.get('habilitado')?.valueChanges.subscribe(enabled => {
            const controls = ['clientId', 'username'];
            controls.forEach(controlName => {
                const control = this.form.get(controlName);
                if (enabled) {
                    control?.setValidators([Validators.required]);
                } else {
                    control?.clearValidators();
                }
                control?.updateValueAndValidity();
            });
        });
    }

    private loadConfiguration(): void {
        this.loading = true;
        this.service.getConfiguracao().subscribe({
            next: (data) => {
                this.form.patchValue({
                    habilitado: data.habilitado,
                    modo: data.modo ?? ModoImobtech.Homologacao,
                    clientId: data.clientId || '',
                    username: data.username || '',
                    clientSecret: '', // Não retorna do back
                    password: ''      // Não retorna do back
                });
                this.loading = false;
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar configurações.' });
                this.loading = false;
                console.error(err);
            }
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const formValue = this.form.value;

        const request: ImobtechConfiguration = {
            habilitado: formValue.habilitado,
            modo: formValue.modo,
            clientId: formValue.clientId,
            username: formValue.username,
            // Envia apenas se preenchido (back trata isso)
            clientSecret: formValue.clientSecret || undefined,
            password: formValue.password || undefined
        };

        this.service.atualizarConfiguracao(request).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Configurações salvas com sucesso!' });
                this.loading = false;
                this.loadConfiguration(); // Recarrega para confirmar estado
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar configurações.' });
                this.loading = false;
                console.error(err);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/']); // Volta para dashboard ou outra página
    }
}
