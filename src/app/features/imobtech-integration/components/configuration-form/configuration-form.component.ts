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
import { UauConfigurationService } from '../../../uau-integration/services/uau-configuration.service';
import { UauConfiguration } from '../../../uau-integration/models/uau-configuration.model';

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
    private uauService = inject(UauConfigurationService); // Injected UAU Service
    private messageService = inject(MessageService);
    private router = inject(Router);

    form!: FormGroup;
    uauForm!: FormGroup; // UAU Form
    loading = false;
    loadingUau = false;

    modoOptions = [
        { label: 'Homologação', value: ModoImobtech.Homologacao },
        { label: 'Produção', value: ModoImobtech.Producao }
    ];

    ngOnInit(): void {
        this.initForm();
        this.initUauForm();
        this.loadConfiguration();
        this.loadUauConfiguration();
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

    private initUauForm(): void {
        this.uauForm = this.fb.group({
            sistemaIntegracao: ['UAU', Validators.required],
            stringConexao: ['', Validators.required],

            // Legacy / Clickmenos
            usuarioClickmenos: ['', Validators.required],
            senhaClickmenos: [''],
            urlApiClickmenos: ['', Validators.required],
            urlApiGraphql: ['', Validators.required],

            // API UAU
            urlApi: ['', Validators.required],
            usuarioUau: ['', Validators.required],
            usuarioActiveDirectory: ['', Validators.required],
            senhaUau: ['']
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
                this.messageService.add({ severity: 'error', summary: 'Erro Imobtech', detail: 'Falha ao carregar configurações Imobtech.' });
                this.loading = false;
                console.error(err);
            }
        });
    }

    private loadUauConfiguration(): void {
        this.loadingUau = true;
        this.uauService.getCredenciais().subscribe({
            next: (data) => {
                this.uauForm.patchValue({
                    sistemaIntegracao: data.sistemaIntegracao || 'UAU',
                    stringConexao: data.stringConexao || '',

                    usuarioClickmenos: data.usuarioClickmenos || '',
                    urlApiClickmenos: data.urlApiClickmenos || '',
                    urlApiGraphql: data.urlApiGraphql || '',

                    urlApi: data.urlApi || '',
                    usuarioUau: data.usuarioUau || '',
                    usuarioActiveDirectory: data.usuarioActiveDirectory || '',

                    senhaUau: '',
                    senhaClickmenos: ''
                });
                this.loadingUau = false;
            },
            error: (err) => {
                // Silencioso ou warning, pois pode não ter config ainda
                console.warn('Config UAU não carregada ou inexistente', err);
                this.loadingUau = false;
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
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Configurações Imobtech salvas!' });
                this.loading = false;
                this.loadConfiguration();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar configurações Imobtech.' });
                this.loading = false;
                console.error(err);
            }
        });
    }

    onUauSubmit(): void {
        if (this.uauForm.invalid) {
            this.uauForm.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        this.loadingUau = true;
        const formValue = this.uauForm.value;

        const request: UauConfiguration = {
            sistemaIntegracao: formValue.sistemaIntegracao,
            stringConexao: formValue.stringConexao,

            usuarioClickmenos: formValue.usuarioClickmenos,
            senhaClickmenos: formValue.senhaClickmenos || undefined,
            urlApiClickmenos: formValue.urlApiClickmenos,
            urlApiGraphql: formValue.urlApiGraphql,

            urlApi: formValue.urlApi,
            usuarioUau: formValue.usuarioUau,
            usuarioActiveDirectory: formValue.usuarioActiveDirectory,
            senhaUau: formValue.senhaUau || undefined
        };

        this.uauService.atualizarCredenciais(request).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Configurações UAU salvas!' });
                this.loadingUau = false;
                this.loadUauConfiguration();
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar configurações UAU.' });
                this.loadingUau = false;
                console.error(err);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/']);
    }
}
