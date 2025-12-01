import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ButtonComponent } from '../../buttons/app-button.component';

@Component({
  selector: 'app-no-records-found',
  templateUrl: './no-records-found.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoPipe, ButtonComponent],
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
