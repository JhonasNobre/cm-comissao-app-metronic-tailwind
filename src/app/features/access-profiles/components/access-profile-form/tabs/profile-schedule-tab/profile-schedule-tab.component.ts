import { Component, EventEmitter, Input, OnInit, Output, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { StateService } from '../../../../../states/services/state.service';
import { State } from '../../../../../states/models/state.model';
import { City } from '../../../../../states/models/city.model';
import { HolidayService } from '../../../../../../core/services/holiday.service';
import { Holiday } from '../../../../../../core/models/holiday.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-profile-schedule-tab',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        CheckboxModule,
        SelectModule,
        InputMaskModule,
        ButtonModule,
        DividerModule,
        TooltipModule
    ],
    templateUrl: './profile-schedule-tab.component.html'
})
export class ProfileScheduleTabComponent implements OnInit, OnDestroy {
    private stateService = inject(StateService);
    private holidayService = inject(HolidayService);
    private fb = inject(FormBuilder);

    @Input() form!: FormGroup;
    @Input() hasRestricaoHorario: boolean = false;
    @Input() diasSemanaOptions: any[] = [];

    @Output() restricaoHorarioToggle = new EventEmitter<boolean>();
    @Output() addHorarioClick = new EventEmitter<void>();
    @Output() removeHorarioClick = new EventEmitter<number>();

    states: State[] = [];
    cities: City[] = [];

    // Holiday selection properties
    nationalHolidays: Holiday[] = [];
    regionalHolidays: Holiday[] = [];
    allNationalHolidaysSelected = false;
    showNationalHolidays = false;

    private subscriptions: Subscription = new Subscription();

    ngOnInit(): void {
        this.loadStates();

        // Watch for changes in Estado to load cities
        const estadoControl = this.form.get('estadoId');
        if (estadoControl) {
            // Initial load if value exists
            if (estadoControl.value) {
                // We need to wait for states to load first
                this.subscriptions.add(
                    this.stateService.list().subscribe(states => {
                        this.states = states;
                        if (estadoControl.value) {
                            this.loadCities(estadoControl.value);
                        }
                    })
                );
            }

            this.subscriptions.add(
                estadoControl.valueChanges.subscribe(estadoId => {
                    if (!estadoId) {
                        this.cities = [];
                        this.form.get('municipioId')?.setValue(null);
                        return;
                    }

                    // Load cities by state ID
                    this.loadCities(estadoId);

                    // Clear city if state changes
                    this.form.get('municipioId')?.setValue(null);
                })
            );
        }
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadStates(): void {
        this.stateService.list().subscribe(states => {
            this.states = states;
        });
    }

    loadCities(stateId: string): void {
        if (!stateId) {
            this.cities = [];
            return;
        }
        this.stateService.listCities(stateId).subscribe(cities => {
            this.cities = cities;
        });
    }

    get horarios(): FormArray {
        return this.form.get('horarios') as FormArray;
    }

    get feriadosIds(): FormArray {
        return this.form.get('feriadosIds') as FormArray;
    }

    loadNationalHolidays(): void {
        this.holidayService.listNationalHolidays().subscribe({
            next: (holidays) => {
                this.nationalHolidays = holidays;
                this.updateAllNationalHolidaysCheckbox();
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
            this.nationalHolidays.forEach(holiday => {
                const exists = feriadosArray.controls.some(
                    control => control.value === holiday.id
                );
                if (!exists) {
                    feriadosArray.push(this.fb.control(holiday.id));
                }
            });
        } else {
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
            const exists = feriadosArray.controls.some(
                control => control.value === holidayId
            );
            if (!exists) {
                feriadosArray.push(this.fb.control(holidayId));
            }
        } else {
            const index = feriadosArray.controls.findIndex(
                control => control.value === holidayId
            );
            if (index !== -1) {
                feriadosArray.removeAt(index);
            }
        }

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

    onToggleChange(event: any): void {
        this.restricaoHorarioToggle.emit(event.checked);
    }

    onAddHorario(): void {
        this.addHorarioClick.emit();
    }

    onRemoveHorario(index: number): void {
        this.removeHorarioClick.emit(index);
    }
}
