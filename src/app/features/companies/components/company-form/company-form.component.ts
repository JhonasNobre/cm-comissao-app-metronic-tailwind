import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CompanyService } from '../../services/company.service';
import { Company, CompanyStatus } from '../../models/company.model';

@Component({
    selector: 'app-company-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        InputMaskModule,
        CardModule,
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './company-form.component.html'
})
export class CompanyFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private companyService = inject(CompanyService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    form!: FormGroup;
    isEditMode = false;
    companyId: string | null = null;
    loading = false;

    statusOptions = [
        { label: 'Ativo', value: CompanyStatus.ACTIVE },
        { label: 'Inativo', value: CompanyStatus.INACTIVE },
        { label: 'Pendente', value: CompanyStatus.PENDING },
        { label: 'Bloqueado', value: CompanyStatus.BLOCKED }
    ];

    ngOnInit(): void {
        this.initForm();
        this.checkEditMode();
    }

    private initForm(): void {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            tradeName: ['', [Validators.required]],
            cnpj: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            status: [CompanyStatus.ACTIVE, [Validators.required]],
            address: this.fb.group({
                street: [''],
                number: [''],
                complement: [''],
                neighborhood: [''],
                city: [''],
                state: [''],
                zipCode: ['']
            })
        });
    }

    private checkEditMode(): void {
        this.companyId = this.route.snapshot.paramMap.get('id');
        if (this.companyId) {
            this.isEditMode = true;
            this.loadCompany(this.companyId);
        }
    }

    private loadCompany(id: string): void {
        this.loading = true;
        this.companyService.get(id).subscribe({
            next: (company) => {
                if (company) {
                    this.form.patchValue(company);
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Empresa não encontrada' });
                    this.router.navigate(['/companies']);
                }
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar empresa' });
                this.loading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        const companyData = this.form.value;

        if (this.isEditMode && this.companyId) {
            this.companyService.update(companyData, this.companyId).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Empresa atualizada com sucesso' });
                    setTimeout(() => this.router.navigate(['/companies']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar empresa' });
                    this.loading = false;
                }
            });
        } else {
            this.companyService.create(companyData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Empresa criada com sucesso' });
                    setTimeout(() => this.router.navigate(['/companies']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar empresa' });
                    this.loading = false;
                }
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/companies']);
    }
}
