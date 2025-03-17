import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonComponent, SmartTranslatePipe } from '@asset-sg/client-shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

// todo assets-300, assets-420: finalize interface to be used with styling; add translation keys in proper places
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
        iconKey: 'geometry-point',
      },
      {
        translationKey: 'Asset Linie',
        iconKey: 'geometry-line',
      },
      {
        translationKey: 'Asset Fläche',
        iconKey: 'geometry-polygon',
      },
    ],
  },
  {
    name: 'Freigabe',
    type: 'access',
    styleItems: [
      {
        translationKey: 'Öffentlich',
        iconKey: 'access-public',
      },
      {
        translationKey: 'Intern',
        iconKey: 'access-internal',
      },
      {
        translationKey: 'gesperrt',
        iconKey: 'access-locked',
      },
    ],
  },
];

@Component({
  selector: 'asset-sg-map-legend',
  imports: [
    CdkAccordion,
    CdkAccordionItem,
    SvgIconComponent,
    ButtonComponent,
    AsyncPipe,
    TranslateModule,
    SmartTranslatePipe,
  ],
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
