import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { Component } from '@angular/core';
import { ButtonComponent } from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface MapStyle {
  name: string;
  type: 'geometry' | 'access';
  styleItems: MapStyleItem[];
}

interface MapStyleItem {
  translationKey: string;
  iconKey: string;
}

const mapStyles: MapStyle[] = [
  {
    name: 'Geometrie',
    type: 'geometry',
    styleItems: [
      {
        translationKey: 'Asset Punkt',
        iconKey: 'arrow-up',
      },
      {
        translationKey: 'Asset Linie',
        iconKey: 'arrow-down',
      },
      {
        translationKey: 'Asset Fläche',
        iconKey: 'settings',
      },
    ],
  },
  {
    name: 'Freigabe',
    type: 'access',
    styleItems: [
      {
        translationKey: 'Öffentlich',
        iconKey: 'settings',
      },
      {
        translationKey: 'Intern',
        iconKey: 'arrow-up',
      },
      {
        translationKey: 'gesperrt',
        iconKey: 'arrow-down',
      },
    ],
  },
];

@Component({
  selector: 'asset-sg-map-legend',
  imports: [CdkAccordion, CdkAccordionItem, SvgIconComponent, ButtonComponent, AsyncPipe, TranslateModule],
  templateUrl: './map-legend.component.html',
  styleUrl: './map-legend.component.scss',
})
export class MapLegendComponent {
  private activeStyleIndex = 0;
  private activeStyleSubject = new BehaviorSubject(mapStyles[this.activeStyleIndex]);
  protected activeStyle$ = this.activeStyleSubject.asObservable();

  protected handleChange() {
    // todo assets-300, assets-420: handle change
    this.activeStyleIndex = (this.activeStyleIndex + 1) % mapStyles.length;
    this.activeStyleSubject.next(mapStyles[this.activeStyleIndex]);
  }
}
