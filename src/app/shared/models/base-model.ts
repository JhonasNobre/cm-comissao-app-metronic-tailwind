// base-model.ts
export interface BaseEntity {
    id: number | string;
    updateBy?: string;
    updateDate?: Date;
    deleteDate?: Date;
    active?: boolean;
}

export abstract class BaseModel implements BaseEntity {
    id!: number | string;
    updateBy!: string;
    updateDate!: Date;
    deleteDate?: Date;
    active!: boolean;

    /**
     * Converte uma string de data (ex: "AAAA-MM-DD") vinda de um DateOnly da API
     * para um objeto Date, de forma segura, evitando problemas de fuso horário.
     */
    protected fromApiDateOnly(dateOnlyString: string | Date | null | undefined): Date | null {
        if (!dateOnlyString) return null;
        if (dateOnlyString instanceof Date) return dateOnlyString;

        const datePart = dateOnlyString.split('T')[0];
        const localDateString = datePart.replace(/-/g, '/');

        const date = new Date(localDateString);
        // Verifica se a data resultante é válida
        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * Construtor bem simples: apenas atribui qualquer-chave de `init` para o this.
     * Se o JSON vier com dateUpdate como string e você quiser convertê-la para Date,
     * pode tratar manualmente lá onde precisar. Aqui só jogamos tudo no objeto.
     */
    constructor(init?: Partial<BaseModel>) {
        if (init) {
            Object.assign(this, init);
            if (init.updateDate && typeof init.updateDate === 'string') {
                this.updateDate = new Date(init.updateDate);
            }
        }
    }

    /**
     * Se você ainda quiser ter um fromJson “encapsulado”, pode usar este método.
     * Mas, se preferir, basta sempre fazer `new FooModel(obj)`.
     */
    static fromJson<T extends BaseModel>(
        this: new (init?: Partial<T>) => T,
        json: Partial<T>
    ): T {
        return new this(json);
    }

    /**
     * Transforma a instância em um objeto “plain” (por exemplo, para enviar de volta
     * ao servidor). Aqui só devolvemos um clone simples, sem conversor de datas.
     */
    toJson(): any {
        const obj: any = {};
        Object.keys(this).forEach((key) => {
            const val = (this as any)[key];
            // Se quiser transformar `Date` em string ISO, faça:
            // if (val instanceof Date) obj[key] = val.toISOString();
            // else obj[key] = val;
            obj[key] = val;
        });
        return obj;
    }
}
