import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { TooltipModule } from 'primeng/tooltip';
import { StateService } from '../../../../../states/services/state.service';

@Component({
    selector: 'app-user-schedule-tab',
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
        TooltipModule
    ],
    templateUrl: './user-schedule-tab.component.html'
})
export class UserScheduleTabComponent implements OnInit {
    @Input() parentForm!: FormGroup;
    @Input() diasSemanaOptions: any[] = [];

    hasRestricaoHorario = false;
    states: any[] = [];
    cities: any[] = [];

    private stateService = inject(StateService);

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.loadStates();

        const restricaoGroup = this.parentForm.get('restricaoHorario');

        // Sync local state with 'ativo' control
        this.hasRestricaoHorario = restricaoGroup?.get('ativo')?.value === true;

        // Initialize cities if state is present
        const stateId = restricaoGroup?.get('estadoId')?.value;
        if (this.hasRestricaoHorario && stateId) {
            this.loadCities(stateId);
        }

        // Listen to active changes to toggle UI
        restricaoGroup?.get('ativo')?.valueChanges.subscribe(isActive => {
            this.hasRestricaoHorario = isActive;
        });

        // Listen to state changes to load cities
        restricaoGroup?.get('estadoId')?.valueChanges.subscribe(stateId => {
            if (stateId) {
                this.loadCities(stateId);
            } else {
                this.cities = [];
                restricaoGroup?.get('municipioId')?.setValue(null);
            }
        });
    }

    loadStates(): void {
        this.stateService.list().subscribe(data => this.states = data);
    }

    loadCities(stateId: string): void {
        this.stateService.listCities(stateId).subscribe(data => this.cities = data);
    }

    get horarios(): FormArray {
        return this.parentForm.get('restricaoHorario.horarios') as FormArray;
    }

    addHorario(): void {
        const horarioGroup = this.fb.group({
            diaSemana: ['Segunda', Validators.required],
            horaInicio: ['08:00', Validators.required],
            horaFim: ['18:00', Validators.required]
        });
        this.horarios.push(horarioGroup);
        this.sortHorarios();
    }

    removeHorario(index: number): void {
        this.horarios.removeAt(index);
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

        while (this.horarios.length !== 0) {
            this.horarios.removeAt(0);
        }
        horariosArray.forEach(item => {
            this.horarios.push(item.control);
        });
    }

    toggleRestricaoHorario(event: any): void {
        const isChecked = event.checked;
        this.hasRestricaoHorario = isChecked;

        const group = this.parentForm.get('restricaoHorario');
        group?.get('ativo')?.setValue(isChecked);

        if (!isChecked) {
            group?.patchValue({
                bloquearEmFeriadosNacionais: false,
                estadoId: null,
                municipioId: null
            });
            while (this.horarios.length !== 0) {
                this.horarios.removeAt(0);
            }
        } else if (this.horarios.length === 0) {
            this.addHorario();
        }
    }
}
