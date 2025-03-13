import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { Component } from '@angular/core';
import { ButtonComponent } from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';

@Component({
  selector: 'asset-sg-map-legend',
  imports: [CdkAccordion, CdkAccordionItem, SvgIconComponent, ButtonComponent],
  templateUrl: './map-legend.component.html',
  styleUrl: './map-legend.component.scss',
})
export class MapLegendComponent {
  protected handleChange() {
    // todo assets-300, assets-420: handle change
  }
}
