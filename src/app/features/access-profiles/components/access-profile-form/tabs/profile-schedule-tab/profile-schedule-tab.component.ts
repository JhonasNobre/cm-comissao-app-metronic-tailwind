import { Component, EventEmitter, Input, OnInit, Output, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { InputMaskModule } from 'primeng/inputmask';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { StateService } from '../../../../../states/services/state.service';
import { State } from '../../../../../states/models/state.model';
import { City } from '../../../../../states/models/city.model';
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

    @Input() form!: FormGroup;
    @Input() hasRestricaoHorario: boolean = false;
    @Input() diasSemanaOptions: any[] = [];

    @Output() restricaoHorarioToggle = new EventEmitter<boolean>();
    @Output() addHorarioClick = new EventEmitter<void>();
    @Output() removeHorarioClick = new EventEmitter<number>();

    states: State[] = [];
    cities: City[] = [];
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
