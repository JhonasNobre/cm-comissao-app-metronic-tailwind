// OrgNode - Estrutura para o componente de diagrama hierárquico
// Fornecida pela equipe de frontend

export interface OrgNode {
    id: string;
    name: string;           // Nome do membro
    role: string;           // Cargo/Nível hierárquico
    people: number;         // Contagem de subordinados
    avatar?: string;        // URL do avatar (ou placeholder)
    first?: boolean;        // Indica se é o nó raiz
    last?: boolean;         // Indica se não tem filhos
    isBonus?: boolean;      // Indica se é nível bônus (estilo amarelo)
    children?: OrgNode[];   // Subordinados
}

// Helper para criar um placeholder de avatar com iniciais
export function getAvatarInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Helper para contar subordinados recursivamente
export function countSubordinates(node: OrgNode): number {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce((acc, child) => acc + 1 + countSubordinates(child), 0);
}

// Helper para converter dados do backend para OrgNode
export function convertToOrgNode(
    member: { id: string; nome: string; cargo?: string; avatarUrl?: string },
    role: string,
    subordinates: OrgNode[] = [],
    options?: { first?: boolean; last?: boolean; isBonus?: boolean }
): OrgNode {
    return {
        id: member.id,
        name: member.nome,
        role: role,
        people: countSubordinates({ id: '', name: '', role: '', people: 0, children: subordinates }) + subordinates.length,
        avatar: member.avatarUrl,
        first: options?.first,
        last: options?.last || (subordinates.length === 0),
        isBonus: options?.isBonus,
        children: subordinates.length > 0 ? subordinates : undefined
    };
}
