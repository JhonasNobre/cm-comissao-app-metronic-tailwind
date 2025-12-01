import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { FormValidations } from '../../../validators/form.validator';

@Component({
    selector: 'app-form-field-error',
    standalone: true,
    imports: [CommonModule, TranslocoPipe],
    template: `
    <small *ngIf="errorKey" class="text-red-500">
      <b>* {{ errorKey | transloco: { field: fieldName, validatorValue: validatorValue } }}</b>
    </small>
  `,
})
export class FormFieldErrorComponent {
    /** O controle que possui erros (pode ser FormControl, FormGroup, FormArray…) */
    @Input() control: AbstractControl | null = null;

    /** Nome “legível” do campo, para exibir na mensagem (e.g. “CNPJ”, “E-mail” etc.) */
    @Input() fieldName!: string;

    /** Caso queira inserir alguma classe extra no <small> */
    @Input() style: string = '';

    /** Valor de parâmetro (ex: requiredLength, min, max) para a mensagem */
    validatorValue?: string | number;

    /**
     *  Retorna a chave de tradução exata (ex: "core.validation.required")
     *  ou `null` se não houver erro a exibir.
     */
    get errorKey(): string | null {
        // Se não há controle ou não está inválido, não exibe nada
        if (!this.control || !this.control.errors) {
            return null;
        }

        // Só exibe erro depois que o usuário interagiu (dirty ou touched)
        if (!(this.control.dirty || this.control.touched)) {
            return null;
        }

        // Percorre o objeto de erros (ValidationErrors) e retorna a primeira chave encontrada
        const errors: ValidationErrors = this.control.errors;
        for (const validatorName in errors) {
            if (errors.hasOwnProperty(validatorName)) {
                // Extrai o “valor do validador” se houver (min, max, minlength, maxlength, pattern…)
                this.extractValidatorValue(validatorName, errors[validatorName]);
                // Retorna somente a chave – a tradução será feita pelo Transloco
                return FormValidations.getErrorMsg(validatorName) || null;
            }
        }
        return null;
    }

    /** Preenche `validatorValue` de acordo com o tipo de erro */
    private extractValidatorValue(
        validatorName: string,
        validatorObj: any
    ): void {
        switch (validatorName) {
            case 'min':
                this.validatorValue = validatorObj.min;
                break;
            case 'max':
                this.validatorValue = validatorObj.max;
                break;
            case 'minlength':
                this.validatorValue = validatorObj.requiredLength;
                break;
            case 'maxlength':
                this.validatorValue = validatorObj.requiredLength;
                break;
            case 'pattern':
                // Se quiser passar o próprio pattern ou uma mensagem genérica, defina aqui:
                this.validatorValue = validatorObj.requiredPattern || '';
                break;
            default:
                // Se não for um validador com parâmetro, limpa
                this.validatorValue = undefined;
        }
    }
}
