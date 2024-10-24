import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { Router, RouterLink } from '@angular/router';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { LetModule } from '@rx-angular/template/let';
import { debounceTime, map } from 'rxjs';
import { supportedLangs } from '../../i18n';
import { getCurrentLang } from '../../utils';
import { AnchorComponent } from '../button';

@Component({
  selector: 'asset-sg-language-selector',
  standalone: true,
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SvgIconComponent, MatMenu, MatMenuTrigger, RouterLink, MatButton, AnchorComponent, LetModule],
})
export class LanguageSelectorComponent {
  private readonly router = inject(Router);

  public readonly currentLang$ = getCurrentLang();

  public readonly languages$ = this.currentLang$.pipe(
    debounceTime(0),
    map((currentLang) =>
      supportedLangs.map((lang) => ({
        isActive: lang === currentLang.lang,
        lang: lang.toUpperCase(),
        params: [`/${lang}${currentLang.path}`],
        queryParams: currentLang.queryParams,
      }))
    )
  );
}
