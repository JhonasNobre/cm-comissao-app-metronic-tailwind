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
import { HolidayService } from '../../../../../../core/services/holiday.service';
import { Holiday } from '../../../../../../core/models/holiday.model';

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

    // Holiday selection properties
    nationalHolidays: Holiday[] = [];
    regionalHolidays: Holiday[] = [];
    allNationalHolidaysSelected = false;
    showNationalHolidays = false;

    private stateService = inject(StateService);
    private holidayService = inject(HolidayService);

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.loadStates();

        const restricaoGroup = this.parentForm.get('restricaoHorario');

        // Sync local state with 'ativo' control
        this.hasRestricaoHorario = restricaoGroup?.get('ativo')?.value === true;

        // Initialize cities and holidays if state is present
        const stateId = restricaoGroup?.get('estadoId')?.value;
        if (this.hasRestricaoHorario) {
            this.loadNationalHolidays();
            if (stateId) {
                this.loadCities(stateId);
                this.loadRegionalHolidays(stateId);
            }
        }

        // Listen to active changes to toggle UI
        restricaoGroup?.get('ativo')?.valueChanges.subscribe(isActive => {
            this.hasRestricaoHorario = isActive;
            if (isActive) {
                this.loadNationalHolidays();
            }
        });

        // Listen to state changes to load cities and regional holidays
        restricaoGroup?.get('estadoId')?.valueChanges.subscribe(stateId => {
            if (stateId) {
                this.loadCities(stateId);
                this.loadRegionalHolidays(stateId);
            } else {
                this.cities = [];
                this.regionalHolidays = [];
                restricaoGroup?.get('municipioId')?.setValue(null);
            }
        });
    }

    loadStates(): void {
        this.stateService.list().subscribe(data => {
            this.states = data;
            // Retry loading regional holidays if state is selected
            const restricaoGroup = this.parentForm.get('restricaoHorario');
            const stateId = restricaoGroup?.get('estadoId')?.value;
            if (this.hasRestricaoHorario && stateId) {
                this.loadRegionalHolidays(stateId);
            }
        });
    }

    loadCities(stateId: string): void {
        this.stateService.listCities(stateId).subscribe(data => this.cities = data);
    }

    loadNationalHolidays(): void {
        this.holidayService.listNationalHolidays().subscribe({
            next: (holidays) => {
                this.nationalHolidays = holidays;
                // Check if all national holidays are already selected
                this.updateAllNationalHolidaysCheckbox();

                // If any national holiday is selected, show the list
                const hasSelected = this.nationalHolidays.some(h => this.isHolidaySelected(h.id));
                if (hasSelected) {
                    this.showNationalHolidays = true;
                }
            }
        });
    }

    loadRegionalHolidays(stateId: string): void {
        const state = this.states.find(s => s.id === stateId);
        if (!state) return;

        this.holidayService.listRegionalHolidays(state.uf).subscribe({
            next: (holidays) => {
                this.regionalHolidays = holidays;
            }
        });
    }

    toggleShowNationalHolidays(): void {
        this.showNationalHolidays = !this.showNationalHolidays;

        if (this.showNationalHolidays && this.nationalHolidays.length === 0) {
            this.loadNationalHolidays();
        }
    }

    toggleAllNationalHolidays(checked: boolean): void {
        this.allNationalHolidaysSelected = checked;
        const feriadosArray = this.feriadosIds;

        if (checked) {
            // Add all national holidays that aren't already selected
            this.nationalHolidays.forEach(holiday => {
                const exists = feriadosArray.controls.some(
                    control => control.value === holiday.id
                );
                if (!exists) {
                    feriadosArray.push(this.fb.control(holiday.id));
                }
            });
        } else {
            // Remove all national holidays
            const nationalIds = this.nationalHolidays.map(h => h.id);
            for (let i = feriadosArray.length - 1; i >= 0; i--) {
                if (nationalIds.includes(feriadosArray.at(i).value)) {
                    feriadosArray.removeAt(i);
                }
            }
        }
    }

    toggleHoliday(holidayId: string, checked: boolean): void {
        const feriadosArray = this.feriadosIds;

        if (checked) {
            // Add holiday if not already in list
            const exists = feriadosArray.controls.some(
                control => control.value === holidayId
            );
            if (!exists) {
                feriadosArray.push(this.fb.control(holidayId));
            }
        } else {
            // Remove holiday from list
            const index = feriadosArray.controls.findIndex(
                control => control.value === holidayId
            );
            if (index !== -1) {
                feriadosArray.removeAt(index);
            }
        }

        // Update master checkbox state
        if (this.showNationalHolidays) {
            this.updateAllNationalHolidaysCheckbox();
        }
    }

    isHolidaySelected(holidayId: string): boolean {
        return this.feriadosIds.controls.some(
            control => control.value === holidayId
        );
    }

    private updateAllNationalHolidaysCheckbox(): void {
        const selectedNationalCount = this.nationalHolidays.filter(
            h => this.isHolidaySelected(h.id)
        ).length;

        this.allNationalHolidaysSelected = selectedNationalCount === this.nationalHolidays.length && this.nationalHolidays.length > 0;
    }

    get feriadosIds(): FormArray {
        return this.parentForm.get('restricaoHorario.feriadosIds') as FormArray;
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
                estadoId: null,
                municipioId: null
            });
            // Clear feriados
            const feriadosArray = this.feriadosIds;
            while (feriadosArray.length !== 0) {
                feriadosArray.removeAt(0);
            }
            // Clear horarios
            while (this.horarios.length !== 0) {
                this.horarios.removeAt(0);
            }
            // Reset UI state
            this.showNationalHolidays = false;
            this.allNationalHolidaysSelected = false;
        } else if (this.horarios.length === 0) {
            this.addHorario();
        }
    }
}
