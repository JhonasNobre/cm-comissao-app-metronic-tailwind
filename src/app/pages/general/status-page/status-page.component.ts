import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
    selector: 'app-status-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './status-page.component.html',
    styleUrls: ['./status-page.component.scss']
})
export class StatusPageComponent implements OnInit {
    @Input() status: number = 404;
    @Input() title: string = 'Página não encontrada';
    @Input() description: string = 'A página que você está procurando não existe ou foi movida.';
    @Input() icon: string = 'ki-file-deleted'; // Default icon
    @Input() showButton: boolean = true;
    @Input() buttonText: string = 'Voltar para o Início';
    @Input() buttonLink: string = '/';

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        // Override with query params or route data if available
        this.route.data.subscribe(data => {
            if (data['status']) this.status = data['status'];
            if (data['title']) this.title = data['title'];
            if (data['description']) this.description = data['description'];
            if (data['icon']) this.icon = data['icon'];
        });
    }
}
