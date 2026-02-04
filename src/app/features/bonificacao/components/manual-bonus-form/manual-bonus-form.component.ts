import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BonusService } from '../../services/bonus.service';
import { UserService } from '../../../users/services/user.service';
import { UserListDTO } from '../../../users/models/user.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
    selector: 'app-manual-bonus-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        ToastModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        InputNumberModule,
        DatePickerModule
    ],
    providers: [MessageService],
    templateUrl: './manual-bonus-form.component.html'
})
export class ManualBonusFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private bonusService = inject(BonusService);
    private userService = inject(UserService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    form: FormGroup;
    users = signal<UserListDTO[]>([]);
    saving = signal(false);

    origens = [
        { label: 'Caixa da Empresa', value: 'e4b5d8a0-7f3c-4d8e-9a1b-2c3d4e5f6a7b' },
        { label: 'Fundo de Incentivo', value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' },
        { label: 'Receita Imobiliária', value: 'f6e5d4c3-b2a1-4d0c-8b7a-6f5e4d3c2b1a' }
    ];

    constructor() {
        this.form = this.fb.group({
            idUsuario: [null, Validators.required],
            valor: [null, [Validators.required, Validators.min(0.01)]],
            descricao: ['', Validators.required],
            qtdParcelas: [1, [Validators.required, Validators.min(1)]],
            idOrigem: ['e4b5d8a0-7f3c-4d8e-9a1b-2c3d4e5f6a7b', Validators.required],
            dataCompetencia: [new Date(), Validators.required],
            dataPrimeiroVencimento: [new Date(), Validators.required]
        });
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.userService.list({ size: 100 }).subscribe(users => {
            this.users.set(users);
        });
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos corretamente.' });
            return;
        }

        this.saving.set(true);
        const command = { ...this.form.value };

        // Formatar datas para o formato esperado pelo backend se necessário (YYYY-MM-DD)
        if (command.dataCompetencia instanceof Date) {
            command.dataCompetencia = command.dataCompetencia.toISOString().split('T')[0];
        }
        if (command.dataPrimeiroVencimento instanceof Date) {
            command.dataPrimeiroVencimento = command.dataPrimeiroVencimento.toISOString().split('T')[0];
        }

        this.bonusService.lancarBonusManual(command).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Bônus lançado com sucesso!' });
                setTimeout(() => this.router.navigate(['/bonificacao']), 1500);
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao lançar bônus.' });
                this.saving.set(false);
            }
        });
    }
}
