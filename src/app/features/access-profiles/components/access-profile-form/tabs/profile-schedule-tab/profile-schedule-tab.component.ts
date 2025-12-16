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

    private _pendingInitialHolidays: Holiday[] = [];
    @Input() set initialHolidays(holidays: Holiday[]) {
        if (this.states.length > 0) {
            this.processInitialHolidays(holidays);
        } else {
            this._pendingInitialHolidays = holidays;
        }
    }

    @Output() restricaoHorarioToggle = new EventEmitter<boolean>();
    @Output() addHorarioClick = new EventEmitter<void>();
    @Output() removeHorarioClick = new EventEmitter<number>();

    states: State[] = [];
    cities: City[] = [];

    // Holiday selection properties
    // Holiday selection properties
    nationalHolidays: Holiday[] = [];

    // Multi-regional groups
    regionalGroups: {
        id: number;
        estadoId: string | null;
        municipioId: string | null;
        cities: City[];
        holidays: Holiday[];
        loading: boolean;
    }[] = [];

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
            if (this._pendingInitialHolidays.length > 0) {
                this.processInitialHolidays(this._pendingInitialHolidays);
                this._pendingInitialHolidays = [];
            }
        });
    }

    private processInitialHolidays(holidays: Holiday[]): void {
        // Filter only regional holidays
        const regional = holidays.filter(h => h.tipo !== 'Nacional');
        if (regional.length === 0) return;

        // Group by UF and Municipio
        const groups = new Map<string, Holiday[]>();

        regional.forEach(h => {
            // Create a unique key. If municipio is null, use just UF.
            const key = `${h.estadoUF || ''}|${h.municipio || ''}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(h);
        });

        groups.forEach((groupHolidays, key) => {
            const [uf, ibge] = key.split('|');

            if (!uf) return;

            // Find State ID
            const state = this.states.find(s => s.uf === uf);
            if (!state) return;

            // Create group
            const groupIndex = this.regionalGroups.length;
            this.regionalGroups.push({
                id: Date.now() + Math.random(),
                estadoId: state.id,
                municipioId: null, // Will fetch below
                cities: [],
                holidays: [],
                loading: true
            });

            const group = this.regionalGroups[groupIndex];

            // Load cities to find Municipio ID
            this.stateService.listCities(state.id).subscribe(cities => {
                group.cities = cities;

                if (ibge) {
                    const city = cities.find(c => c.codigoIbge.toString() === ibge);
                    if (city) {
                        group.municipioId = city.id;
                    }
                }

                this.loadHolidaysForGroup(groupIndex);
                // Also ensure groupHolidays are checked (they should be via feriadosIds formArray anyway)
            });
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

    addRegionalGroup(): void {
        this.regionalGroups.push({
            id: Date.now(),
            estadoId: null,
            municipioId: null,
            cities: [],
            holidays: [],
            loading: false
        });
    }

    removeRegionalGroup(index: number): void {
        this.regionalGroups.splice(index, 1);
    }

    onGroupStateChange(groupIndex: number, stateId: string): void {
        const group = this.regionalGroups[groupIndex];
        group.estadoId = stateId;
        group.municipioId = null;
        group.cities = [];
        group.holidays = [];

        if (stateId) {
            this.stateService.listCities(stateId).subscribe(cities => {
                group.cities = cities;
            });

            // Load regional holidays immediately when state changes (or wait for city?)
            // Usually regional holidays depend on State. Municipal ones depend on City.
            // We can load State holidays now.
            this.loadHolidaysForGroup(groupIndex);
        }
    }

    onGroupCityChange(groupIndex: number, cityId: string): void {
        const group = this.regionalGroups[groupIndex];
        group.municipioId = cityId;
        this.loadHolidaysForGroup(groupIndex);
    }

    loadHolidaysForGroup(groupIndex: number): void {
        const group = this.regionalGroups[groupIndex];
        if (!group.estadoId) return;

        const state = this.states.find(s => s.id === group.estadoId);
        if (!state) return;

        group.loading = true;

        // Hypothetical service method that supports filtering by city too if needed
        // For now, listRegionalHolidays returns holidays for the state.
        // If we want municipal holidays, the service needs to support it.
        // Assuming listRegionalHolidays(uf) returns state holidays.
        // We might need to filter manually or update service.
        this.holidayService.listRegionalHolidays(state.uf).subscribe({
            next: (holidays) => {
                group.holidays = holidays;
                group.loading = false;
            },
            error: () => {
                group.loading = false;
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
