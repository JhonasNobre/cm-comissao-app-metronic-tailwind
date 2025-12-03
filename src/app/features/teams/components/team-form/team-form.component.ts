import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { TeamService } from '../../services/team.service';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { AccessProfile } from '../../../access-profiles/models/access-profile.model';

@Component({
    selector: 'app-team-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        CheckboxModule,
        SelectModule,
        InputMaskModule,
        CardModule,
        ToastModule,
        DividerModule
    ],
    providers: [MessageService],
    templateUrl: './team-form.component.html'
})
export class TeamFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private teamService = inject(TeamService);
    private accessProfileService = inject(AccessProfileService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private messageService = inject(MessageService);

    form!: FormGroup;
    isEditMode = false;
    teamId: string | null = null;
    loading = false;
    accessProfiles: AccessProfile[] = [];
    hasRestricaoHorario = false;

    diasSemanaOptions = [
        { label: 'Domingo', value: 0 },
        { label: 'Segunda', value: 1 },
        { label: 'Terça', value: 2 },
        { label: 'Quarta', value: 3 },
        { label: 'Quinta', value: 4 },
        { label: 'Sexta', value: 5 },
        { label: 'Sábado', value: 6 }
    ];

    ngOnInit(): void {
        this.loadAccessProfiles();
        this.initForm();
        this.checkEditMode();
    }

    private loadAccessProfiles(): void {
        this.accessProfileService.list().subscribe({
            next: (profiles) => this.accessProfiles = profiles,
            error: (err) => console.error('Error loading access profiles', err)
        });
    }

    private initForm(): void {
        this.form = this.fb.group({
            nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            perfilAcessoId: [null],
            restricaoHorario: this.fb.group({
                bloquearEmFeriadosNacionais: [false],
                ufFeriados: [''],
                codigoIbgeMunicipio: [''],
                horarios: this.fb.array([])
            })
        });
    }

    get horarios(): FormArray {
        return this.form.get('restricaoHorario.horarios') as FormArray;
    }

    addHorario(): void {
        const horarioGroup = this.fb.group({
            diaSemana: [1, Validators.required],
            horaInicio: ['08:00', Validators.required],
            horaFim: ['18:00', Validators.required]
        });
        this.horarios.push(horarioGroup);
    }

    removeHorario(index: number): void {
        this.horarios.removeAt(index);
    }

    toggleRestricaoHorario(event: any): void {
        this.hasRestricaoHorario = event.checked;
        if (!this.hasRestricaoHorario) {
            this.form.get('restricaoHorario')?.patchValue({
                bloquearEmFeriadosNacionais: false,
                ufFeriados: '',
                codigoIbgeMunicipio: ''
            });
            while (this.horarios.length !== 0) {
                this.horarios.removeAt(0);
            }
        } else if (this.horarios.length === 0) {
            this.addHorario();
        }
    }

    private checkEditMode(): void {
        this.teamId = this.route.snapshot.paramMap.get('id');
        if (this.teamId) {
            this.isEditMode = true;
            this.loadTeam(this.teamId);
        }
    }

    private loadTeam(id: string): void {
        this.loading = true;
        this.teamService.get(id).subscribe({
            next: (team: any) => {
                if (team) {
                    this.form.patchValue({
                        nome: team.nome,
                        perfilAcessoId: team.perfilAcessoId
                    });

                    if (team.restricaoHorario) {
                        this.hasRestricaoHorario = true;
                        this.form.get('restricaoHorario')?.patchValue({
                            bloquearEmFeriadosNacionais: team.restricaoHorario.bloquearEmFeriadosNacionais,
                            ufFeriados: team.restricaoHorario.ufFeriados,
                            codigoIbgeMunicipio: team.restricaoHorario.codigoIbgeMunicipio
                        });

                        while (this.horarios.length !== 0) {
                            this.horarios.removeAt(0);
                        }
                        if (team.restricaoHorario.horarios) {
                            team.restricaoHorario.horarios.forEach((h: any) => {
                                const horarioGroup = this.fb.group({
                                    diaSemana: [h.diaSemana, Validators.required],
                                    horaInicio: [h.horaInicio, Validators.required],
                                    horaFim: [h.horaFim, Validators.required]
                                });
                                this.horarios.push(horarioGroup);
                            });
                        }
                    }
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Equipe não encontrada' });
                    this.router.navigate(['/teams']);
                }
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar equipe' });
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
        const formValue = this.form.getRawValue();

        const payload = {
            ...formValue,
            restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null
        };

        if (this.isEditMode && this.teamId) {
            this.teamService.update(payload, this.teamId).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Equipe atualizada com sucesso' });
                    setTimeout(() => this.router.navigate(['/teams']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao atualizar equipe' });
                    this.loading = false;
                }
            });
        } else {
            this.teamService.create(payload).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Equipe criada com sucesso' });
                    setTimeout(() => this.router.navigate(['/teams']), 1000);
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao criar equipe' });
                    this.loading = false;
                }
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/teams']);
    }
}
