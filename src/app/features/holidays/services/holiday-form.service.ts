import { Injectable } from '@angular/core';
import { FormItemBase } from '../../../shared/components/ui/dynamic-form/models/form-item-base';
import { FormItemTextbox } from '../../../shared/components/ui/dynamic-form/models/form-item-textbox';
import { FormItemDropdown } from '../../../shared/components/ui/dynamic-form/models/form-item-dropdown';
import { FormItemDate } from '../../../shared/components/ui/dynamic-form/models/form-item-date';
import { Holiday, HolidayType } from '../models/holiday.model';

@Injectable({ providedIn: 'root' })
export class HolidayFormService {
    getFormFields(holiday?: Holiday): FormItemBase[] {
        return [
            new FormItemTextbox({
                key: 'name',
                label: 'Nome do Feriado',
                value: holiday?.name,
                required: true,
                order: 1
            }),
            new FormItemDate({
                key: 'date',
                label: 'Data',
                value: holiday?.date ? new Date(holiday.date) : null,
                required: true,
                order: 2
            }),
            new FormItemDropdown({
                key: 'type',
                label: 'Tipo',
                value: holiday?.type || HolidayType.NATIONAL,
                required: true,
                options: [
                    { label: 'Nacional', value: HolidayType.NATIONAL },
                    { label: 'Estadual', value: HolidayType.STATE },
                    { label: 'Municipal', value: HolidayType.MUNICIPAL }
                ],
                order: 3
            }),
            new FormItemTextbox({
                key: 'stateCode',
                label: 'UF (Estado)',
                value: holiday?.stateCode,
                required: false,
                order: 4
            }),
            new FormItemTextbox({
                key: 'city',
                label: 'Município',
                value: holiday?.city,
                required: false,
                order: 5
            })
        ];
    }


}
