import { formatDate } from '@angular/common';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { FormItemBase } from '../components/ui/dynamic-form/models/form-item-base';
import { ISelectItem } from '../models/common/select-item.model';

// #region Date
export function calculateDate(initialDate?: Date | string | null, endDate?: Date | string | null): number | undefined {
    if (!initialDate || !endDate) {
        return undefined;
    }

    // Garante que ambos sejam objetos Date
    const startDate = initialDate instanceof Date ? initialDate : new Date(initialDate);
    const endDateObj = endDate instanceof Date ? endDate : new Date(endDate);

    // Verifica se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDateObj.getTime())) {
        return undefined;
    }

    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());

    const diffInMs = Math.abs(start.getTime() - end.getTime());
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // converte de ms para dias
}
// #endregion

export function splitUrl(url: string): string {
    // 1. Defina todas as palavras-chave que indicam uma "rota filha" em um array.
    const childRouteKeywords = [
        '/profile', '/terrain', '/edification', '/residence',
        '/vehicle', '/management', '/company', '/details',
        '/create', '/edit'
    ];

    // 2. Encontre o índice da primeira ocorrência de qualquer uma das palavras-chave na URL.
    const firstMatchIndex = Math.min(
        ...childRouteKeywords
            .map(keyword => {
                const index = url.indexOf(keyword);
                // Se o keyword não for encontrado, retornamos um valor muito alto (Infinity)
                // para que ele não seja escolhido como o mínimo.
                return index === -1 ? Infinity : index;
            })
    );

    // 3. Se um dos keywords foi encontrado (o índice não será Infinity)...
    if (isFinite(firstMatchIndex)) {
        // ...corta a string da URL do início até o índice onde a palavra-chave foi encontrada.
        return url.substring(0, firstMatchIndex);
    }

    // 4. Se nenhuma palavra-chave foi encontrada, retorna a URL original sem modificação.
    return url;
}

// #region Url
export function splitUrl2(url: string): string {
    if (url.includes('profile')) {
        var urlSplitted = url.split("/profile", 1);
        url = urlSplitted[0];
    }
    if (url.includes('terrain')) {
        var urlSplitted = url.split("/terrain", 1);
        url = urlSplitted[0];
    }
    if (url.includes('edification')) {
        var urlSplitted = url.split("/edification", 1);
        url = urlSplitted[0];
    }
    if (url.includes('residence')) {
        var urlSplitted = url.split("/residence", 1);
        url = urlSplitted[0];
    }
    if (url.includes('vehicle')) {
        var urlSplitted = url.split("/vehicle", 1);
        url = urlSplitted[0];
    }
    if (url.includes('management')) {
        var urlSplitted = url.split("/management", 1);
        url = urlSplitted[0];
    }
    if (url.includes('company')) {
        var urlSplitted = url.split("/company", 1);
        url = urlSplitted[0];
    }
    if (url.includes('details')) {
        var urlSplitted = url.split("/details", 1);
        url = urlSplitted[0];
    }
    if (url.includes('create')) {
        var urlSplitted = url.split("/create", 1);
        url = urlSplitted[0];
    }
    if (url.includes('edit')) {
        var urlSplitted = url.split("/edit", 1);
        url = urlSplitted[0];
    }
    return url;
}

export function separateParameters(params: any): any {
    //?taxes=inss&taxes
    let urlParams: any;
    let queryParams: any = {};
    let urlParamsList: any = [];
    if (params) {
        for (let key in params) {
            if (Array.isArray(params[key])) {
                for (let item of params[key]) {
                    urlParamsList.push(`${key}=${item}`);
                }
            } else if (typeof (params[key]) !== 'function') {
                queryParams[key] = params[key];
            }
        }
        if (urlParamsList.length) {
            urlParams = `?${urlParamsList.join('&')}`;
        }
    }
    if (!urlParams) {
        urlParams = "";
    }
    return [urlParams, queryParams];
}

// #endregion

// #region Validators

/**
 * Remove tudo o que não for dígito e valida o tamanho e sequências repetidas.
 */
function sanitize(id: string, expectedLength: number): string | null {
    const digits = id.replace(/\D+/g, '');
    if (digits.length !== expectedLength) return null;
    // impede sequências como "11111111111"
    if (/^(\d)\1+$/.test(digits)) return null;
    return digits;
}

/**
 * Calcula um dígito verificador para CPF/CNPJ
 * @param numbers array de dígitos (como números) sem os dígitos verificadores
 * @param multipliers array de pesos para multiplicação
 */
function calculateVerifier(numbers: number[], multipliers: number[]): number {
    const sum = numbers.reduce((acc, num, idx) => acc + num * multipliers[idx], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
}

/**
 * Valida CPF (11 dígitos)
 */
export function isValidCPF(cpf: string): boolean {
    const raw = sanitize(cpf, 11);
    if (!raw) return false;

    const digits = raw.split('').map(d => +d);
    // primeiros 9 dígitos para o primeiro verificador
    const firstVerifiers = digits.slice(0, 9);
    const v1 = calculateVerifier(firstVerifiers, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (v1 !== digits[9]) return false;

    // primeiros 10 dígitos para o segundo verificador
    const secondVerifiers = digits.slice(0, 10);
    const v2 = calculateVerifier(secondVerifiers, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return v2 === digits[10];
}

/**
 * Valida CNPJ (14 dígitos)
 */
export function isValidCNPJ(cnpj: string): boolean {
    const raw = sanitize(cnpj, 14);
    if (!raw) return false;

    const digits = raw.split('').map(d => +d);
    const base = digits.slice(0, 12);

    // pesos primeiro dígito: [5,4,3,2,9,8,7,6,5,4,3,2]
    const p1 = calculateVerifier(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (p1 !== digits[12]) return false;

    // pesos segundo dígito: [6,...,2] (shift +1)
    const p2 = calculateVerifier([...base, p1], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return p2 === digits[13];
}

// #endregion

// #region Download

export function downloadPdfFileByBlob(data: Blob, fileName: string) {
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
}

export function downloadFileBase64(fileBase64: string, name: string) {
    const a = document.createElement('a');
    a.href = fileBase64;
    a.target = '_blank';
    a.download = name;
    a.click();
    // const a = document.createElement('a');
    // const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
    // if (isSafariBrowser) {
    //   a.setAttribute('target', '_blank');
    // }
    // a.setAttribute('href', url);
    // a.setAttribute('download', name);
    // a.style.visibility = 'hidden';
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
}

export function downloadFileCsv(data: any, fileName: any) {
    let blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    let dwldLink = document.createElement("a");
    let url = URL.createObjectURL(blob);
    let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
        dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", fileName);
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
}

export function downloadFilePrint(data: any) {
    let dwldLink = document.createElement("a");
    let url = URL.createObjectURL(data);
    let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {  //if Safari open in new window to save file with random filename.
        dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    // dwldLink.setAttribute("download", fileName);
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
}
// #endregion

// #region Numbers
export function padNumber(value: number) {
    if (isNumber(value)) {
        return `0${value}`.slice(-2);
    } else {
        return '';
    }
}

export function isNumber(value: any): boolean {
    return !isNaN(toInteger(value));
}

export function convertToNumber(b: any) {
    if (b && typeof b == 'string') {
        return parseInt(b);
    }
    return b;
}

export function toInteger(value: any): number {
    return parseInt(`${value}`, 10);
}

// #endregion

// #region Data and Time
export function dateFormat(date: Date): string {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    if (date) {
        return `${day}/${month}/${year}`;
    }

    return '';
}

export function dateFormat2(date: any): string {
    if (!date) {
        return ''; // Retorna uma string vazia se a data for inválida
    }

    const parsedDate = date instanceof Date ? date : new Date(date); // Converte string em Date
    if (isNaN(parsedDate.getTime())) {
        return ''; // Retorna vazio se a conversão falhar
    }

    // Formate a data (exemplo: "DD/MM/YYYY")
    const day = parsedDate.getDate().toString().padStart(2, '0');
    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
}


export function dateCustomFormat(date: any): string {
    let stringDate = '';
    if (date) {
        stringDate += isNumber(date.month) ? padNumber(date.month) + '/' : '';
        stringDate += isNumber(date.day) ? padNumber(date.day) + '/' : '';

        stringDate += date.year;
    }
    return stringDate;
}

export function getDateFormatterFromString(dateInStr: string): any {
    if (dateInStr && dateInStr.length > 0) {
        const dateParts = dateInStr.trim().split('/');
        return [
            {
                year: toInteger(dateParts[2]),
                month: toInteger(dateParts[0]),
                day: toInteger(dateParts[1])
            }
        ];
    }

    const _date = new Date();
    return [
        {
            year: _date.getFullYear(),
            month: _date.getMonth() + 1,
            day: _date.getDay()
        }
    ];
}

export function getDateFromString(dateInStr: string = ''): Date | null {
    if (dateInStr && dateInStr.length > 0 && dateInStr.length < 9) {
        const day = toInteger(dateInStr.substring(0, 2));
        const month = toInteger(dateInStr.substring(2, 4));
        const year = toInteger(dateInStr.substring(4, 8));

        // const dateParts = dateInStr.trim().split('/');
        // const year = this.toInteger(dateParts[2]);
        // const month = this.toInteger(dateParts[0]);
        // const day = this.toInteger(dateParts[1]);
        // tslint:disable-next-line:prefer-const
        let result = new Date();
        result.setDate(day);
        result.setMonth(month - 1);
        result.setFullYear(year);
        return result;
    }
    if (dateInStr && dateInStr.length > 8) {
        const day = toInteger(dateInStr.substring(0, 2));
        const month = toInteger(dateInStr.substring(3, 5));
        const year = toInteger(dateInStr.substring(6, 10));

        const result = new Date();
        result.setDate(day);
        result.setMonth(month - 1);
        result.setFullYear(year);
        return new Date(dateInStr.substring(6, 10) + '-' + dateInStr.substring(3, 5) + '-' + dateInStr.substring(0, 2) + 'T00:00:00');
    }
    return null;
}

export function getFormatDate(_date?: Date): string | null {
    if (!_date) {
        return null;
    }

    var date = new Date(_date);
    const format = 'yyyy-MM-dd';
    const locale = 'en-US';
    return formatDate(date, format, locale);
}

/**
 * Converte uma Date UTC para string formatada no fuso especificado.
 * @param utcDateTime – Date em UTC
 * @param timeZone – identificador IANA do fuso (ex: 'America/Sao_Paulo')
 * @returns string no formato "DD/MM/YYYY HH:mm:ss"
 */
export function convertToTimeZone(utcDateTime: Date, timeZone: string): string {
    // Usa locale pt-BR para garantir ordem dia/mês/ano e 24h
    return utcDateTime.toLocaleString('pt-BR', {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

export function calculateDifferenceInDays(dateDue: Date): number {
    const dataAtual = new Date();
    const dataFutura = new Date(dateDue);

    const dataAtualMs = dataAtual.getTime();
    const dataFinalMs = dataFutura.getTime();

    const diferencaMs = dataFinalMs - dataAtualMs;

    const diferencaDias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

    return diferencaDias;
}

// #endregion

// #region PDF

export function base64toBlob(base64Data: any, contentType: any) {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
        const begin = sliceIndex * sliceSize;
        const end = Math.min(begin + sliceSize, bytesLength);

        const bytes = new Array(end - begin);
        for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
            bytes[i] = byteCharacters[offset].charCodeAt(0);
        }
        byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
}

// #endregion

// #region Imagem
/**
 * Converte o conteúdo base64 de uma imagem em um data URL válido.
 * Se não receber dados, retorna string vazia.
 */
export function convertImageUrlToImageBase64(dataURL: string | null | undefined): string {
    return dataURL
        ? `data:image/jpeg;base64,${dataURL}`
        : '';
}


/**
 * Converte um Blob em Base64 data URL.
 * @param blob – arquivo Blob (imagem, PDF, etc).
 * @returns Promise que resolve para uma string data URL ex: "data:image/png;base64,iVBORw0..."
 */
export function convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('FileReader.result não é string'));
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

/**
 * Remove o prefixo "data:*\/*;base64," de uma string Base64.
 * @param dataURL – string data URL completa.
 * @returns somente o payload Base64.
 */
export function stripDataUrlPrefix(dataURL: string): string {
    const commaIndex = dataURL.indexOf(',');
    return commaIndex >= 0
        ? dataURL.substring(commaIndex + 1)
        : dataURL;
}

/**
 * Formata um tamanho em bytes para uma string legível (Bytes, KB, MB, ...).
 * @param bytes – valor em bytes.
 * @param decimals – casas decimais (padrão 2).
 * @returns ex: "1.23 MB"
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const k = 1024;
    const dm = Math.max(0, decimals);
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calcula o tamanho (em bytes e string formatada) de uma string Base64.
 * @param base64 – payload Base64 (sem o prefixo data URL).
 * @returns objeto com tamanho em bytes e em string (KB/MB/...).
 */
export function calculateBase64Size(base64: string): { bytes: number; formatted: string } {
    // remove possíveis quebras de linha
    const cleaned = base64.trim();
    const paddingMatches = cleaned.match(/=+$/);
    const padding = paddingMatches ? paddingMatches[0].length : 0;
    const base64Length = cleaned.length;
    // cada 4 chars representam 3 bytes, menos padding
    const bytes = Math.floor((base64Length * 3) / 4) - padding;
    return {
        bytes,
        formatted: formatBytes(bytes),
    };
}

/**
 * Converte um data URL para um Blob.
 * @param dataURL – string data URL completa ("data:[mime];base64,AAAA...").
 * @returns Blob com o conteúdo decodificado.
 */
export function dataURLToBlob(dataURL: string): Blob {
    const [meta, payload] = dataURL.split(',');
    if (!payload) {
        throw new Error('Data URL inválido');
    }
    const isBase64 = meta.includes(';base64');
    const raw = isBase64
        ? atob(payload)
        : decodeURIComponent(payload);
    // extrai o content-type ou usa application/octet-stream
    const match = meta.match(/data:(.*?)(;|$)/);
    const contentType = match ? match[1] : 'application/octet-stream';

    const buffer = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        buffer[i] = raw.charCodeAt(i);
    }
    return new Blob([buffer], { type: contentType });
}


export function checkValidTouched(control: FormControl) {
    return control.errors && (control.dirty || control.touched);
}

export function applyCssError(control: any) {
    return {
        'is-invalid': checkValidTouched(control)
    }
}

export function checkFormValidations(formGroup: FormGroup) {
    let invalidControle = [];
    const controls = formGroup.controls;
    for (const name in controls) {
        if (controls[name].invalid) {
            invalidControle.push(getControlLabel(name));
        }
    }

    Object.keys(formGroup.controls)
        .forEach(campo => {
            const controle = formGroup.get(campo);

            controle?.markAsDirty();
            controle?.markAsTouched();

            if (controle instanceof FormGroup) {
                checkFormValidations(controle);
            }

            if (controle instanceof FormArray) {
                controle.controls.forEach(item => {
                    if (item instanceof FormGroup) {
                        checkFormValidations(item);
                    }
                });
            }
        });

    return invalidControle;
}

export function getControlLabel(controlId: string): string {

    if (controlId === 'entityChildId') {
        return 'Campos referente a Identificação: Entidade Filha';
    }
    if (controlId === 'entityId') {
        return 'Entidade';
    }
    if (controlId === 'propertyType') {
        return 'Tipo de Propriedade';
    }
    if (controlId === 'street') {
        return 'Endereço';
    }
    if (controlId === 'streetNumber') {
        return 'Número do Endereço';
    }
    if (controlId === 'district') {
        return 'Bairro';
    }
    if (controlId === 'zipCode') {
        return 'CEP';
    }
    if (controlId === 'cityId') {
        return 'Cidade';
    }
    if (controlId === 'stateId') {
        return 'Estado';
    }
    if (controlId === 'countryId') {
        return 'País';
    }
    if (controlId === 'terrains') {
        return 'Campos referente ao Terreno:';
    }
    if (controlId === 'possessionTitleId') {
        return 'Título de Posse';
    }
    if (controlId === 'irregularityObservation') {
        return 'Observações sobre a Nomenclatura Registrada';
    }

    if (controlId === 'number') {
        return 'Número';
    }
    if (controlId === 'procurator') {
        return 'Procurador';
    }
    if (controlId === 'dateProcuration') {
        return 'Data da Procuração';
    }
    if (controlId === 'dateRegistration') {
        return 'Data do Registro';
    }
    if (controlId === 'dateExpiration') {
        return 'Data do Vencimento';
    }
    if (controlId === 'registration') {
        return 'Número da Inscrição';
    }
    if (controlId === 'otherDate') {
        return 'Outra Data';
    }
    if (controlId === 'expirationDate') {
        return 'Data do Vencimento';
    }
    if (controlId === 'approvedDate') {
        return 'Data da Aprovação';
    }
    if (controlId === 'isActive') {
        return 'Status';
    }
    if (controlId === 'observation') {
        return 'Observação';
    }
    if (controlId === 'companyId') {
        return 'Empresa';
    }
    if (controlId === 'cadastralSituation') {
        return 'Situação Cadastral';
    }
    if (controlId === 'cadastralSituationDate') {
        return 'Data Inscrição Estadual';
    }
    if (controlId === 'taxOccurrence') {
        return 'Ocorrência Fiscal';
    }
    if (controlId === 'businessActivityId') {
        return 'Atividade Principal';
    }
    if (controlId === 'identificationId') {
        return 'Identificação da Propriedade';
    }
    if (controlId === 'registry') {
        return 'Matrícula CEI / CNO';
    }
    if (controlId === 'dateVoto') {
        return 'Data da Ata / Voto';
    }
    if (controlId === 'register') {
        return 'Número do Registro de Ata Legal';
    }
    if (controlId === 'changedItems') {
        return 'Itens do Voto / Alterações da Ata';
    }
    if (controlId === 'cnpj') {
        return 'CNPJ';
    }
    if (controlId === 'name') {
        return 'Nome';
    }
    if (controlId === 'propertyTypeId') {
        return 'Utilização';
    }
    if (controlId === 'establishmentId') {
        return 'Estabelecimento';
    }

    if (controlId === 'entityTypeId') {
        return 'Tipo de Entidade';
    }
    if (controlId === 'description') {
        return 'Descrição';
    }
    if (controlId === 'subDescription') {
        return 'Sub Descrição da Notificação';
    }
    if (controlId === 'fileTypeId') {
        return 'Tipo do Documento';
    }
    if (controlId === 'fileType') {
        return 'Tipo do Documento';
    }
    if (controlId === 'legalEntityId') {
        return 'Entidade Legal';
    }
    if (controlId === 'companyName') {
        return 'Nome da Empresa';
    }
    return controlId
}

export const flatListToTree = <T>(flatList: T[], idPath: keyof T, parentIdPath: keyof T, childListPath: keyof T, isParent: (t: T) => boolean) => {
    const rootParents: T[] = [];
    const map: any = {};
    for (const item of flatList) {
        if (!(item as any)[childListPath]) (item as any)[childListPath] = [];
        map[item[idPath]] = item;
    }
    for (const item of flatList) {
        const parentId = item[parentIdPath];
        if (isParent(item)) {
            rootParents.push(item);
        } else {
            const parentItem = map[parentId];
            parentItem[childListPath].push(item);
        }
    }
    return rootParents;
};

// #endregion

// #region Enums
/**
 * Retorna só os valores “reais” de um enum (elimina as chaves reversas de numeric enums).
 */
export function getEnumValues<T extends Record<string, string | number>>(enumObj: T): Array<string | number> {
    return Object
        .values(enumObj)
        .filter(v => typeof v === 'string' || typeof v === 'number') as Array<string | number>;
}

/**
 * Constrói um dropdown a partir de qualquer enum.
 * Retorna Observable de ISelectItem, onde value será string|number.
 */
export function getDropDownByEnum<T extends Record<string, string | number>>(enumObj: T): Observable<ISelectItem[]> {
    const items: ISelectItem[] = Object.entries(enumObj)
        .filter(([key, value]) => isNaN(Number(key))) // Mantém apenas as chaves que são strings (ignora reversos)
        .map(([key, value]) => ({
            value, // Ex: 1
            label: key, // Ex: "SHARED.ENUMS.TASK_COLUMN.PENDING"
            groupBy: undefined,
        }));

    return of(items);
}


/**
 * Dado um enum e um valor, retorna a chave (nome) correspondente.
 */
export function getEnumKeyByValue<T extends Record<string, string | number>>(enumObj: T, value: string | number): string | undefined {
    return (Object.keys(enumObj) as Array<keyof T>)
        .find(key => enumObj[key] === value) as string | undefined;
}

/**
 * Dado um enum e uma chave (nome), retorna o valor correspondente.
 */
export function getEnumValueByKey<T extends Record<string, string | number>>(enumObj: T, key: string): string | number | undefined {
    return enumObj[key as keyof T];
}

// #endregion

// #region Others
export function toFormGroup(questions: FormItemBase[] | null) {
    const group: any = {};
    questions?.forEach(question => {
        group[question.key] = question.required ? new FormControl(question.value !== undefined && question.value !== null ? question.value : null, Validators.required) : new FormControl(question.value !== undefined && question.value !== null ? question.value : null);
    });
    return new FormGroup(group);
}

export function checkIsNullOrUndefined(value: any): boolean {
    return value === null || value === undefined;
}

export function getFileIcon(contentType?: string): string {
    if (contentType === 'application/pdf') {
        return 'pi pi-file-pdf';
    }
    if (contentType === 'image/jpg' || contentType === 'image/jpeg' || contentType === 'image/gif' || contentType === 'image/x-png') {
        return 'pi pi-images';
    }
    if (contentType === 'word') {
        return 'pi pi-file-word';
    }
    if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        return 'pi pi-file-excel';
    }
    return 'pi pi-file-o';
}

// #endregion

//#region String

export function formatFileName(entityName: string, reportName: string): string {
    const formattedEntityCode = extractCode(entityName)
    const formattedReportName = replaceSpacesAndHyphens(reportName)
    return `${formattedEntityCode}_${formattedReportName}`;
}

function replaceSpacesAndHyphens(input: string): string {
    return input.replace(/[\s-]/g, "_");
}

function extractCode(input: string): string {
    const match = input.match(/^\d+/);
    return match ? match[0] : '';
}
//#endregion

// //#region Tree

// export function collectSelectedNodes(nodes: TreeNode[], selectedNodes: TreeNode[] = []): void {
//     nodes.forEach(node => {
//         if (node.selected) {
//             selectedNodes.push(node); // Adiciona o nó selecionado à lista
//         }

//         // Verifica os filhos recursivamente
//         if (node.children) {
//             collectSelectedNodes(node.children, selectedNodes);
//         }
//     });
// }

// export function updatePartialSelection(nodes: TreeNode[]): void {
//     nodes.forEach(node => {
//         if (node.children && node.children.length > 0) {
//             // Conta quantos filhos estão selecionados
//             const selectedChildren = node.children.filter((child: TreeNode) => child.selected).length;
//             const totalChildren = node.children.length;

//             // Define o estado partialSelected
//             node.partialSelected = selectedChildren > 0 && selectedChildren < totalChildren;

//             // Atualiza os filhos recursivamente
//             updatePartialSelection(node.children);
//         }
//     });
// }
// //#endregion
