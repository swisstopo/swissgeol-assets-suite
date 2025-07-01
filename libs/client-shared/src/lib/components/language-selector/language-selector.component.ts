import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { LanguageService } from '../../services';
import { AnchorComponent } from '../button';

@Component({
  selector: 'asset-sg-language-selector',
  standalone: true,
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  imports: [SvgIconComponent, MatMenu, MatMenuTrigger, RouterLink, MatButton, AnchorComponent, AsyncPipe],
})
export class LanguageSelectorComponent {
  private readonly languageService = inject(LanguageService);

  public readonly language$ = this.languageService.language$;

  public readonly languagesInfos$ = this.languageService.languageInfos$;
}
