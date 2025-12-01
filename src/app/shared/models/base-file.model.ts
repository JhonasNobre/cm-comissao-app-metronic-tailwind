import { BaseModel } from './base-model';

export abstract class BaseFileModel extends BaseModel {
    // Campos comuns a qualquer “arquivo”
    identifier!: string;
    fileText!: string;
    fileName!: string;
    translated!: string;
    contentType!: string;
    fileSize!: number;

    constructor(init?: Partial<BaseFileModel>) {
        super(init);
        if (init) {
            // Copia todos os campos de init (incluindo identifier, fileName etc.)
            Object.assign(this, init);

            // Se você costuma receber fileSize como string e quer garantir número:
            if (init.fileSize != null && typeof init.fileSize === 'string') {
                this.fileSize = parseInt(init.fileSize, 10);
            }
        }
    }
}
