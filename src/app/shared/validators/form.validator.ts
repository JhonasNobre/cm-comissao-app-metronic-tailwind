import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

export class FormValidations {

  static requiredMinCheckbox(min = 1): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const totalChecked = (formArray as FormArray).controls
        .map(v => v.value)
        .reduce((total, current) => current ? total + current : total, 0);
      return totalChecked >= min ? null : { required: true };
    };
  }

  static cepValidator(control: AbstractControl): ValidationErrors | null {
    const zipCode = control.value;
    if (zipCode && !/^\d{8}$/.test(zipCode)) {
      return { cepInvalido: true };
    }
    return null;
  }

  static dateValidator(control: AbstractControl): ValidationErrors | null {
    const date = control.value;
    if (!date || !/^\d{8}$/.test(date)) {
      return { dateInvalido: true };
    }
    const formattedDate = `${date.substring(4,8)}-${date.substring(2,4)}-${date.substring(0,2)}T00:00:00`;
    const parsedDate = new Date(formattedDate);
    if (isNaN(parsedDate.getTime())) {
      return { dateInvalido: true };
    }
    return null;
  }

  static equalsTo(otherField: string): ValidatorFn {
    return (formControl: AbstractControl): ValidationErrors | null => {
      if (!formControl.parent) return null;

      const field = formControl.parent.get(otherField);
      if (!field) {
        throw new Error('É necessário informar um campo válido.');
      }

      if (field === formControl) return null;

      return field.value !== formControl.value ? { equalsTo: otherField } : null;
    };
  }

  static emailValidator(control: AbstractControl): ValidationErrors | null {
    return /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(control.value)
      ? null
      : { emailInvalido: true };
  }

  static readonly errorMessages: Record<string, string> = {
    required: 'general.validation.required',
    min: 'general.validation.min_length',
    max: 'general.validation.max_length',
    minlength: 'general.validation.min_length_field',
    maxlength: 'general.validation.max_length_field',
    cepInvalido: 'general.validation.invalid_zip_code',
    dateInvalido: 'general.validation.invalid_date',
    emailInvalido: 'general.validation.email_already_registered',
    equalsTo: 'general.validation.equals_to',
    pattern: 'general.validation.pattern',
  };

  static getErrorMsg(validatorName: string): string | undefined {
    return this.errorMessages[validatorName];
  }
}
