# 🎨 Padrões de Frontend

Este documento descreve os padrões arquiteturais e componentes reutilizáveis adotados no projeto Clickmenos Frontend.

---

## 1. Tabela Genérica (`GenericPTableComponent`)

Para padronizar todas as listagens do sistema, utilizamos o componente `GenericPTableComponent`. Ele encapsula o PrimeNG Table e oferece funcionalidades padrão como paginação, ordenação e ações (Editar/Excluir).

### Como usar

1. **Importe o componente** no seu `standalone component`:
   ```typescript
   imports: [GenericPTableComponent]
   ```

2. **Defina as colunas** no seu componente:
   ```typescript
   columns: ColumnHeader<MyModel>[] = [
       { field: 'nome', header: 'Nome' },
       { field: 'ativo', header: 'Ativo', displayAs: 'yesNo' }, // 'text' | 'number' | 'currency' | 'date' | 'yesNo' | 'boolean'
       { field: 'criadoEm', header: 'Data', displayAs: 'date' }
   ];
   ```

3. **Use no template HTML**:
   ```html
   <app-generic-p-table 
       tableName="my-list" 
       [tableData]="items" 
       [columnDefinition]="columns"
       [displayCreateAction]="true"
       [displayEditAction]="true" 
       [displayDeleteAction]="true"
       (create)="onNew()"
       (edit)="onEdit($event)"
       (delete)="onDelete($event)">
   </app-generic-p-table>
   ```

---

## 2. Serviço Base (`BaseService`)

Todos os serviços que realizam operações CRUD devem estender `BaseService`. Isso garante tratamento de erros padronizado e reutilização de código.

### Implementação

```typescript
@Injectable({ providedIn: 'root' })
export class UserService extends BaseService {
    constructor(http: HttpClient) {
        super(http, '/v1/usuarios'); // Define o endpoint base
    }

    // Métodos list(), get(), create(), update(), delete() são herdados automaticamente!
    
    // Adicione métodos específicos se necessário
    bloquear(id: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${id}/bloquear`, {});
    }
}
```

---

## 3. Formulários Reativos

Utilizamos `ReactiveFormsModule` com componentes do PrimeNG.

### Padrão de Implementação

1. **Injeção de Dependências**:
   ```typescript
   private fb = inject(FormBuilder);
   private service = inject(UserService);
   ```

2. **Inicialização**:
   ```typescript
   private initForm(): void {
       this.form = this.fb.group({
           nome: ['', [Validators.required, Validators.minLength(3)]],
           email: ['', [Validators.required, Validators.email]]
       });
   }
   ```

3. **Submissão**:
   ```typescript
   onSubmit(): void {
       if (this.form.invalid) {
           this.form.markAllAsTouched();
           return;
       }
       // Lógica de create/update
   }
   ```

### Validação Visual

No HTML, use a verificação de `invalid` e `touched` para exibir erros:

```html
<input pInputText formControlName="nome" />
<div *ngIf="form.get('nome')?.invalid && form.get('nome')?.touched" class="text-danger">
    Nome é obrigatório.
</div>
```

---

## 4. Estrutura de Diretórios (Feature Modules)

Cada funcionalidade (CRUD) deve seguir esta estrutura:

```
src/app/features/nome-feature/
├── components/
│   ├── feature-list/       # Componente de listagem
│   └── feature-form/       # Componente de formulário
├── models/                 # Interfaces/Types
└── services/               # Serviço específico
```

---

## 5. Value Objects e Tipos Especiais

### Restrição de Horário
Para entidades que possuem restrição de horário (Usuários, Equipes, Perfis), o backend espera um objeto complexo. O frontend deve montar esse objeto conforme o contrato da API (`RestricaoHorarioAcessoDto`).

### Permissões
Para Perfis de Acesso, as permissões são enviadas como uma lista de objetos contendo `RecursoId`, `Acao` e `NivelAcesso`.
