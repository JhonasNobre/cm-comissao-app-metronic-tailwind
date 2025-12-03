import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TeamService } from '../../services/team.service';
import { AccessProfileService } from '../../../access-profiles/services/access-profile.service';
import { TeamListDTO } from '../../models/team.model';
import { AccessProfile } from '../../../access-profiles/models/access-profile.model';

@Component({
    selector: 'app-team-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        ToastModule
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
            perfilAcessoId: [null]
        });
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
            next: (team) => {
                if (team) {
                    this.form.patchValue(team);
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
        const teamData = this.form.value;

        if (this.isEditMode && this.teamId) {
            this.teamService.update(teamData, this.teamId).subscribe({
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
            this.teamService.create(teamData).subscribe({
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
