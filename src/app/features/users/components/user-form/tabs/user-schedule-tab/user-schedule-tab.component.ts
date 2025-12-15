import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormArray, FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { TooltipModule } from 'primeng/tooltip';

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

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        // Check initial state based on data
        const restricaoGroup = this.parentForm.get('restricaoHorario');
        // Simple check: if form is valid/has values, we assume it's active or logic in parent set it. 
        // Better: we rely on parent passing the correct state or we infer it. 
        // Let's infer from the fact that we use 'restricaoHorario' form group.
        // Actually parent manages the structure.

        // Let's sync local state with parent form
        // If parent has data, hasRestricaoHorario should be true.
        // However, parent logic was: "payload.restricaoHorario: this.hasRestricaoHorario ? ..."
        // So the form group might exist but be empty. 

        // Let's assume if there are schedules or flag is set, it is true.
        // But purely relying on 'restricaoHorario' group existence is safer if parent logic aligns.

        // For now, let's keep the toggle logic here but we need to initialize 'hasRestricaoHorario' correctly.
        // Valid way: check if bloqFeriados is true OR uf is set OR schedules > 0
        const val = restricaoGroup?.value;
        if (val && (val.bloquearEmFeriadosNacionais || val.ufFeriados || (val.horarios && val.horarios.length > 0))) {
            this.hasRestricaoHorario = true;
        }
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
        this.hasRestricaoHorario = event.checked;
        if (!this.hasRestricaoHorario) {
            this.parentForm.get('restricaoHorario')?.patchValue({
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
}
