import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Holiday, HolidayType } from '../../models/holiday.model';
import { StateService } from '../../../states/services/state.service';
import { State } from '../../../states/models/state.model';
import { City } from '../../../states/models/city.model';

@Component({
    selector: 'app-holiday-form-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        DatePickerModule
    ],
    templateUrl: './holiday-form-dialog.component.html'
})
export class HolidayFormDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private ref = inject(DynamicDialogRef);
    private config = inject(DynamicDialogConfig);
    private stateService = inject(StateService);

    form!: FormGroup;
    loading = false;
    states: State[] = [];
    cities: City[] = [];

    typeOptions = [
        { label: 'Nacional', value: HolidayType.NATIONAL },
        { label: 'Estadual', value: HolidayType.STATE },
        { label: 'Municipal', value: HolidayType.MUNICIPAL }
    ];

    ngOnInit(): void {
        this.loadStates();
        this.initForm();

        if (this.config.data?.holiday) {
            this.patchForm(this.config.data.holiday);
        }
    }

    initForm(): void {
        this.form = this.fb.group({
            id: [null],
            name: ['', [Validators.required]],
            date: [null, [Validators.required]],
            type: [HolidayType.NATIONAL, [Validators.required]],
            estadoId: [null], // Renamed from stateCode
            municipioId: [null] // Renamed from city
        });
    }

    patchForm(holiday: Holiday): void {
        const date = holiday.date ? new Date(holiday.date) : null;

        this.form.patchValue({
            id: holiday.id,
            name: holiday.name,
            date: date,
            type: holiday.type,
            estadoId: holiday.estadoId,
            municipioId: holiday.municipioId
        });

        // Trigger loading of cities if state is present
        if (holiday.estadoId) {
            this.loadCities(holiday.estadoId);
        }
    }

    loadStates(): void {
        this.stateService.list().subscribe(data => {
            this.states = data;
        });
    }

    loadCities(stateId: string): void {
        if (!stateId) return;

        // Ensure states loaded? Not strictly necessary if we rely on backend for names, 
        // but for dropdown labels we need them.
        // Assuming states load fast.

        this.stateService.listCities(stateId).subscribe(cities => {
            this.cities = cities;
        });
    }

    onTypeChange(): void {
        const type = this.form.get('type')?.value;
        const stateControl = this.form.get('estadoId');
        const cityControl = this.form.get('municipioId');

        if (type === HolidayType.NATIONAL) {
            stateControl?.clearValidators();
            stateControl?.setValue(null);
            cityControl?.clearValidators();
            cityControl?.setValue(null);
        } else if (type === HolidayType.STATE) {
            stateControl?.setValidators([Validators.required]);
            cityControl?.clearValidators();
            cityControl?.setValue(null);
        } else if (type === HolidayType.MUNICIPAL) {
            stateControl?.setValidators([Validators.required]);
            cityControl?.setValidators([Validators.required]);
        }

        stateControl?.updateValueAndValidity();
        cityControl?.updateValueAndValidity();
    }

    onStateChange(): void {
        const stateId = this.form.get('estadoId')?.value;
        this.form.get('municipioId')?.setValue(null);
        this.cities = [];

        if (stateId) {
            this.loadCities(stateId);
        }
    }

    onSave(): void {
        if (this.form.invalid) return;

        const formValue = this.form.getRawValue();

        const holiday: Holiday = {
            ...formValue,
            // IDs are already GUID strings from form
            // Legacy Deprecated fields filler (optional, can simulate from State List if needed)
            stateCode: this.states.find(s => s.id === formValue.estadoId)?.uf,
            city: this.cities.find(c => c.id === formValue.municipioId)?.nome
        };

        this.ref.close({ form: holiday });
    }

    onCancel(): void {
        this.ref.close();
    }

    get showState(): boolean {
        const type = this.form.get('type')?.value;
        return type === HolidayType.STATE || type === HolidayType.MUNICIPAL;
    }

    get showCity(): boolean {
        const type = this.form.get('type')?.value;
        return type === HolidayType.MUNICIPAL;
    }
}
