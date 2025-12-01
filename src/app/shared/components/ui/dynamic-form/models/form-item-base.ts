import { ISelectItem } from "../../../../models/common/select-item.model";

export class FormItemBase {
    value?: any;
    key: string;
    currentId: string;
    label: string;
    placeholder: string;
    required: boolean;
    order: number;
    controlType: string;
    type: string;
    options: ISelectItem[];
    buildInForm: boolean;

    constructor(
        options: {
            value?: any;
            key?: string;
            currentId?: string;
            label?: string;
            placeholder?: string;
            required?: boolean;
            order?: number;
            controlType?: string;
            type?: string;
            options?: ISelectItem[];
            buildInForm?: boolean;
        } = {}) {
        this.value = options.value;
        this.key = options.key || '';
        this.currentId = options.currentId || '';
        this.label = options.label || '';
        this.placeholder = options.placeholder || '';
        this.required = !!options.required;
        this.order = options.order === undefined ? 1 : options.order;
        this.controlType = options.controlType || '';
        this.type = options.type || '';
        this.options = options.options || [];
        this.buildInForm = options.buildInForm ?? true;
    }
}
