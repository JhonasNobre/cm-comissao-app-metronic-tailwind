import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { TranslocoModule } from '@jsverse/transloco';
import { Observable } from 'rxjs';
import { BaseFormComponent, FormReadyData } from '../../../../shared/components/base/base-form/base-form.component';
import { AccessProfileService } from '../../services/access-profile.service';
import { PermissionDetail } from '../../models/access-profile.model';

@Component({
    selector: 'app-access-profile-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        ButtonModule,
        InputTextModule,
        CheckboxModule,
        SelectModule,
        InputMaskModule,
        DividerModule,
        TableModule,
        InputNumberModule,
        TranslocoModule
    ],
    templateUrl: './access-profile-form.component.html'
})
export class AccessProfileFormComponent extends BaseFormComponent<any> {
    private accessProfileService = inject(AccessProfileService);

    resources: any[] = [];
    permissionRows: any[] = [];
    hasRestricaoHorario = false;

    diasSemanaOptions: any[] = [];

    scopeOptions = [
        { label: 'Dados do Usuário', value: 'DADOS_USUARIO' },
        { label: 'Dados da Equipe', value: 'DADOS_EQUIPE' },
        { label: 'Todos', value: 'TODOS' }
    ];

    protected override loadDependencies(): Observable<any> {
        return this.accessProfileService.listResources();
    }

    protected override loadEntityForEdit(id: string): Observable<any> {
        return this.accessProfileService.get(id);
    }

    protected override onFormReady(data: FormReadyData<any>): void {
        this.diasSemanaOptions = [
            { label: this.translate.translate('general.days.sunday'), value: 'Domingo' },
            { label: this.translate.translate('general.days.monday'), value: 'Segunda' },
            { label: this.translate.translate('general.days.tuesday'), value: 'Terca' },
            { label: this.translate.translate('general.days.wednesday'), value: 'Quarta' },
            { label: this.translate.translate('general.days.thursday'), value: 'Quinta' },
            { label: this.translate.translate('general.days.friday'), value: 'Sexta' },
            { label: this.translate.translate('general.days.saturday'), value: 'Sabado' }
        ];

        this.resources = data.dependencies;
        this.initPermissionRows();

        if (data.entity) {
            this.patchFormData(data.entity);
        }
    }

    protected override newForm(): FormGroup {
        return this.formBuilder.group({
            id: [null],
            nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
            limiteDescontoMaximo: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            quantidadeMaximaReservas: [0, [Validators.required, Validators.min(0)]],
            ehPadrao: [false],
            restricaoHorario: this.formBuilder.group({
                bloquearEmFeriadosNacionais: [false],
                ufFeriados: [''],
                codigoIbgeMunicipio: [''],
                horarios: this.formBuilder.array([])
            })
        });
    }

    protected override getFormValue(): any {
        const formValue = this.form.getRawValue();

        // Build permissions list
        const permissions: any[] = [];
        this.permissionRows.forEach(row => {
            if (row.canCreate) permissions.push({ recursoId: row.recursoId, acao: 'CRIAR', nivelAcesso: row.scope });
            if (row.canRead) permissions.push({ recursoId: row.recursoId, acao: 'LER', nivelAcesso: row.scope });
            if (row.canUpdate) permissions.push({ recursoId: row.recursoId, acao: 'ATUALIZAR', nivelAcesso: row.scope });
            if (row.canDelete) permissions.push({ recursoId: row.recursoId, acao: 'EXCLUIR', nivelAcesso: row.scope });
        });

        return {
            ...formValue,
            restricaoHorario: this.hasRestricaoHorario ? formValue.restricaoHorario : null,
            permissoes: permissions
        };
    }

    protected override onSave(data: any): void {
        // Custom validation for permissions
        const hasPermissions = this.permissionRows.some(r => r.canCreate || r.canRead || r.canUpdate || r.canDelete);
        if (!hasPermissions) {
            this.showWarn('Selecione ao menos uma permissão.');
            return;
        }

        const req$: Observable<any> = this.isEditMode && this.entityId
            ? this.accessProfileService.update(this.entityId, data)
            : this.accessProfileService.create(data);

        req$.subscribe({
            next: () => {
                this.showSuccess(this.translate.translate('base-components.base-forms.save-success'));
                this.onCancel();
            },
            error: (err) => {
                console.error(err);
                this.showError('Erro ao salvar perfil');
            }
        });
    }

    private initPermissionRows(): void {
        this.permissionRows = this.resources.map(res => ({
            recursoId: res.id,
            recursoNome: res.nome,
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            scope: 'DADOS_USUARIO'
        }));
    }

    private patchFormData(data: any): void {
        this.form.patchValue({
            id: data.id,
            nome: data.nome,
            limiteDescontoMaximo: data.limiteDescontoMaximo,
            quantidadeMaximaReservas: data.quantidadeMaximaReservas,
            ehPadrao: data.ehPadrao
        });

        if (data.restricaoHorario) {
            this.hasRestricaoHorario = true;
            this.form.get('restricaoHorario')?.patchValue({
                bloquearEmFeriadosNacionais: data.restricaoHorario.bloquearEmFeriadosNacionais,
                ufFeriados: data.restricaoHorario.ufFeriados,
                codigoIbgeMunicipio: data.restricaoHorario.codigoIbgeMunicipio
            });

            this.clearHorarios();
            if (data.restricaoHorario.horarios) {
                data.restricaoHorario.horarios.forEach((h: any) => {
                    this.addHorario(h);
                });
                this.sortHorarios();
            }
        }

        if (data.permissoes) {
            this.mapPermissionsToRows(data.permissoes);
        }
    }

    private mapPermissionsToRows(permissions: PermissionDetail[]): void {
        permissions.forEach(p => {
            const row = this.permissionRows.find(r => r.recursoId === p.recursoId);
            if (row) {
                if (p.acao === 'CRIAR') row.canCreate = true;
                if (p.acao === 'LER') row.canRead = true;
                if (p.acao === 'ATUALIZAR') row.canUpdate = true;
                if (p.acao === 'EXCLUIR') row.canDelete = true;
                row.scope = p.nivelAcesso;
            }
        });
    }

    get horarios(): FormArray {
        return this.form.get('restricaoHorario.horarios') as FormArray;
    }

    addHorario(data?: any): void {
        const horarioGroup = this.formBuilder.group({
            diaSemana: [data?.diaSemana ?? 'Segunda', Validators.required],
            horaInicio: [data?.horaInicio ?? '08:00', Validators.required],
            horaFim: [data?.horaFim ?? '18:00', Validators.required]
        });
        this.horarios.push(horarioGroup);
        this.sortHorarios();
    }

    removeHorario(index: number): void {
        this.horarios.removeAt(index);
    }

    clearHorarios(): void {
        while (this.horarios.length !== 0) {
            this.horarios.removeAt(0);
        }
    }

    sortHorarios(): void {
        const daysOrder: { [key: string]: number } = {
            'Domingo': 0,
            'Segunda': 1,
            'Terca': 2,
            'Quarta': 3,
            'Quinta': 4,
            'Sexta': 5,
            'Sabado': 6
        };

        const horariosArray = this.horarios.controls.map((control, index) => ({
            control,
            index,
            value: control.value
        }));

        horariosArray.sort((a, b) => {
            const dayA = daysOrder[a.value.diaSemana] ?? 0;
            const dayB = daysOrder[b.value.diaSemana] ?? 0;

            if (dayA !== dayB) {
                return dayA - dayB;
            }

            return a.value.horaInicio.localeCompare(b.value.horaInicio);
        });

        this.clearHorarios();
        horariosArray.forEach(item => {
            this.horarios.push(item.control);
        });
    }

    toggleRestricaoHorario(event: any): void {
        this.hasRestricaoHorario = event.checked;
        if (!this.hasRestricaoHorario) {
            this.form.get('restricaoHorario')?.patchValue({
                bloquearEmFeriadosNacionais: false,
                ufFeriados: '',
                codigoIbgeMunicipio: ''
            });
            this.clearHorarios();
        } else if (this.horarios.length === 0) {
            this.addHorario();
        }
    }
}
