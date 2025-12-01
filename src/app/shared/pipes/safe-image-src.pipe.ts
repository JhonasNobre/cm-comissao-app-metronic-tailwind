import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'safeImageSrc',
    standalone: true,
})
export class SafeImageSrcPipe implements PipeTransform {
    /**
     * Recebe um objeto e o nome do campo que contém os dados da foto,
     * e retorna uma Data URL segura.
     * @param rowData O objeto completo da linha da tabela.
     * @param fieldName O nome da propriedade que contém a string Base64 da foto.
     */
    transform(rowData: any | null | undefined, fieldName: string): string {
        // Verifica se o objeto e o nome do campo são válidos
        if (rowData && fieldName && rowData[fieldName]) {
            const photoData = rowData[fieldName];
            // Supondo que o tipo da imagem é sempre 'image/jpeg'
            return `data:image/jpeg;base64,${photoData}`;
        }

        // Retorna uma imagem padrão se não houver dados
        return './images/default-avatar.png';
    }
}
