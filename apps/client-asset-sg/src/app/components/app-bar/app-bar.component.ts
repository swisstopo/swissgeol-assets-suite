import { ENTER } from '@angular/cdk/keycodes';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { supportedLangs } from '@asset-sg/client-shared';
import { isTruthy } from '@asset-sg/core';
import { Lang } from '@asset-sg/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import queryString from 'query-string';
import { EMPTY, Observable, Subject, debounceTime, filter, map, startWith, switchMap } from 'rxjs';
import { Version } from './version';

@UntilDestroy()
@Component({
  selector: 'asset-sg-app-bar',
  templateUrl: './app-bar.component.html',
  styleUrls: ['./app-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBarComponent implements OnInit {
  // TODO use new pattern here
  @Input() currentSearchText$: Observable<O.Option<string>> = EMPTY;
  @Output() public searchTextChanged: Observable<O.Option<string>>;

  @ViewChild('searchInput', { read: ElementRef, static: true }) searchInput!: ElementRef<HTMLInputElement>;

  public searchTextKeyDown$ = new Subject<KeyboardEvent>();

  public version = '';

  public _currentLang$ = this._router.events.pipe(
    filter((e): e is NavigationEnd => e instanceof NavigationEnd),
    map((e) => e.urlAfterRedirects),
    startWith(this._router.url),
    map(
      flow(
        (url) => O.of(url.match('^/(\\w\\w)(.*)$')),
        O.filter(isTruthy),
        O.bindTo('match'),
        O.bind('lang', ({ match }) => pipe(Lang.decode(match[1]), O.fromEither)),
        O.bind('parsed', ({ match }) => O.of(queryString.parseUrl(match[2]))),
        O.map(({ parsed, lang }) => ({
          lang,
          path: parsed.url,
          queryParams: parsed.query,
        }))
      )
    )
  );

  public links$ = this._currentLang$.pipe(
    debounceTime(0),
    map((currentLang) => ({
      links: supportedLangs.map(
        (lang) =>
          pipe(
            currentLang,
            O.map((cl) => ({
              disabled: lang === cl.lang,
              lang: lang.toUpperCase(),
              params: [`/${lang}${cl.path}`],
              queryParams: cl.queryParams,
            })),
            O.getOrElseW(() => ({
              disabled: false,
              lang: lang.toUpperCase(),
              params: [`/${lang}`],
              queryParams: {},
            }))
          ),
        {}
      ),
    }))
  );

  private _ngOnInit$ = new Subject<void>();

  constructor(private _router: Router, private readonly httpClient: HttpClient) {
    this.httpClient.get<Version>('/assets/version.json').subscribe((v) => (this.version = v.version));
    this.searchTextChanged = this.searchTextKeyDown$.pipe(
      filter((ev) => ev.keyCode === ENTER),
      map((ev) => {
        const value = (ev.target as HTMLInputElement).value;
        return value ? O.some(value) : O.none;
      })
    );
    // TODO use new pattern here
    this._ngOnInit$
      .pipe(switchMap(() => this.currentSearchText$.pipe(map(O.toNullable), untilDestroyed(this))))
      .subscribe((currentSearchText) => {
        if (currentSearchText != this.searchInput.nativeElement.value) {
          this.searchInput.nativeElement.value = currentSearchText || '';
        }
      });
  }

  // TODO use new pattern here
  ngOnInit() {
    this._ngOnInit$.next();
  }
}
