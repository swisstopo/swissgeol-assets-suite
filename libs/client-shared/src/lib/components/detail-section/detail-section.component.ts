import { Component, Input } from '@angular/core';

@Component({
  selector: 'asset-sg-detail-section',
  templateUrl: './detail-section.component.html',
  styleUrls: ['./detail-section.component.scss'],
  standalone: true,
})
export class DetailSectionComponent {
  @Input() title = '';
}
