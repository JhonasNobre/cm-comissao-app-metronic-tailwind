import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-no-records-found',
  templateUrl: './no-records-found.component.html',
  standalone: true,
  imports: [CommonModule, ButtonModule],
})
export class NoRecordsFoundComponent {

  @Input() label = 'general.phrase.no_matching_records_found';
  @Input() btnLabel = 'general.singular.new';
  @Input() length: number = 0;
  @Input() hasBtnCreate = true;

  @Output() onClick = new EventEmitter<any>();

  onClickButton(event: Event) {
    this.onClick.emit(event);
  }
}
