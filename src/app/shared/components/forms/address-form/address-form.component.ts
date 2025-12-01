import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { InputMaskModule } from 'primeng/inputmask';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Serviços
import { CityService } from '../../../../features/config/country/country-management/city/city.service';
import { Session } from '../../../models/common/session.model';
import { SessionService } from '../../../services/session.service';
import { Endereco } from '../../../services/via-cep/endereco.model';
import { ViacepService } from '../../../services/via-cep/viacep.service';

// Componentes e Diretivas
import { FetchCitiesDirective } from '../../../directives/selects/fetch-cities.directive';
import { FetchCountriesDirective } from '../../../directives/selects/fetch-countries.directive';
import { FetchProvincesDirective } from '../../../directives/selects/fetch-provinces.directive';
import { FetchStatesDirective } from '../../../directives/selects/fetch-states.directive';
import { CustomSelectComponent } from '../../custom-select/custom-select.component';
import { CustomTextboxMaskComponent } from '../../custom-textbox-mask/custom-textbox-mask.component';
import { CustomTextboxComponent } from '../../custom-textbox/custom-textbox.component';

@Component({
    selector: 'app-address-form',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, TranslocoModule, InputMaskModule,
        CustomTextboxComponent, CustomTextboxMaskComponent, CustomSelectComponent,
        FetchCountriesDirective, FetchStatesDirective, FetchCitiesDirective, FetchProvincesDirective,
    ],
    templateUrl: './address-form.component.html',
    viewProviders: [
        {
            provide: ControlContainer,
            useFactory: () => inject(ControlContainer, { skipSelf: true })
        }
    ]
})
export class AddressFormComponent implements OnInit, OnDestroy {
    @Input() hasComplement = true;

    form!: FormGroup;
    private controlContainer = inject(ControlContainer);
    private sessionService = inject(SessionService);
    private viacepService = inject(ViacepService);
    private cityService = inject(CityService);

    private destroy$ = new Subject<void>();

    session: Session | undefined;
    isBrazil = false;
    hasProvince = false;
    zipCodeMask = '99999-999';

    ngOnInit(): void {
        this.form = this.controlContainer.control as FormGroup;
        this.initializeComponentData();
        this.setupValueChangeListeners();
    }

    // No seu método setupValueChangeListeners, REATIVE a chamada para handlePostalCodeChanges.
    private setupValueChangeListeners(): void {
        this.handleCountryChanges();
        this.handleStateChanges();
        this.handlePostalCodeChanges(); // <-- Reative esta linha!
    }

    private handlePostalCodeChanges(): void {
        if (!this.isBrazil) {
            return;
        }

        const zipCodeControl = this.form.get('zipCode');
        zipCodeControl?.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe((zipCode: string | null) => {
                // A lógica original, que agora será executada!
                if (zipCode && zipCode.length === 8) {
                    this.fetchAddressByZipCode(zipCode);
                }
            });
    }

    // // NOVO método público para ser chamado pelo evento (blur) do template
    // public onZipCodeBlur(): void {
    //     if (!this.isBrazil) {
    //         return;
    //     }

    //     const zipCode = this.form.get('zipCode')?.value;
    //     if (zipCode && zipCode.length === 8) {
    //         this.fetchAddressByZipCode(zipCode);
    //     }
    // }

    private async initializeComponentData(): Promise<void> {
        this.session = await this.sessionService.getSession();
        if (this.session?.countryCustom) {
            const country = this.session.countryCustom;
            this.isBrazil = country.id === '1cf60bf8-e241-4942-b9af-27b76a2123a9';
            this.hasProvince = country.hasProvince ?? false;
            this.zipCodeMask = country.zipCodeFormat ?? '99999-999';
        }
    }

    private handleCountryChanges(): void {
        this.form.get('countryId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(newCountryId => {
            this.form.get('stateId')?.reset();
            this.form.get('provinceId')?.reset();
            this.form.get('cityId')?.reset();
            if (newCountryId) {
                this.form.get('stateId')?.enable();
            } else {
                this.form.get('stateId')?.disable();
            }
        });
    }

    private handleStateChanges(): void {
        this.form.get('stateId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
            this.form.get('cityId')?.reset();
            if (this.hasProvince) {
                this.form.get('provinceId')?.reset();
            }
        });
    }

    private fetchAddressByZipCode(zipCode: string): void {
        this.viacepService.buscarPorCep(zipCode).then((endereco: Endereco) => {
            if (endereco.erro || !endereco.ibge) { return; }
            this.cityService.getByIbgeCod(endereco.ibge).subscribe(city => {
                if (!city || !city.state) { return; }
                const dataToPatch = {
                    street: endereco.logradouro, district: endereco.bairro,
                    complement: endereco.complemento, stateId: city.stateId,
                    cityId: city.id, countryId: city.state.countryId
                };
                this.form.patchValue(dataToPatch, { emitEvent: true });
            });
        }).catch(err => console.error('Erro ao buscar CEP:', err));
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Getters
    get countryId() { return this.form.get('countryId')?.value; }
    get stateId() { return this.form.get('stateId')?.value; }
    get provinceId() { return this.form.get('provinceId')?.value; }
}
