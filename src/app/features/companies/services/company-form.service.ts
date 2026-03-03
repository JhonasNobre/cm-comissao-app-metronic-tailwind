import { Injectable } from '@angular/core';
import { FormItemBase } from '../../../shared/components/ui/dynamic-form/models/form-item-base';
import { FormItemTextbox } from '../../../shared/components/ui/dynamic-form/models/form-item-textbox';
import { Company } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyFormService {
    getFormFields(company?: Company): FormItemBase[] {
        return [
            new FormItemTextbox({
                key: 'name',
                label: 'Razão Social',
                value: company?.name,
                required: true,
                order: 1
            }),
            new FormItemTextbox({
                key: 'cnpj',
                label: 'CNPJ',
                value: company?.cnpj,
                required: true,
                order: 2
            }),
            new FormItemTextbox({
                key: 'codigoDominioLegado',
                label: 'Código Domínio Legado (UAU)',
                placeholder: 'Ex: 62',
                value: company?.codigoDominioLegado,
                type: 'number',
                required: false,
                order: 3
            })
        ];
    }
}
