import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Lang, ValueItem, getValueItemDescriptionKey, getValueItemNameKey } from '@asset-sg/shared';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, map, merge } from 'rxjs';

@Pipe({ name: 'valueItemBase', pure: false, standalone: true })
abstract class ValueItemBase implements PipeTransform, OnDestroy {
  public value = '';
  private lastValueItem: ValueItem | null = null;
  onLangChange: Subscription | undefined;

  constructor(private translate: TranslateService, private cd: ChangeDetectorRef) {}

  abstract pluckValue(valueItem: ValueItem, lang: string): string;

  updateValue(valueItem: ValueItem): void {
    this.value =
      this.pluckValue(valueItem, this.translate.currentLang) || `${this.translate.currentLang}: ${valueItem.code}`;
    this.cd.markForCheck();
  }

  transform(valueItem: ValueItem): string {
    if (valueItem === this.lastValueItem) {
      return this.value;
    }

    this.lastValueItem = valueItem;

    this.updateValue(valueItem);

    this._dispose();

    if (!this.onLangChange) {
      this.onLangChange = merge(this.translate.onLangChange).subscribe(() => {
        this.updateValue(valueItem);
      });
    }

    return this.value;
  }

  private _dispose(): void {
    if (typeof this.onLangChange !== 'undefined') {
      this.onLangChange.unsubscribe();
      this.onLangChange = undefined;
    }
  }

  ngOnDestroy(): void {
    this._dispose();
  }
}

@Pipe({ name: 'valueItemName', pure: false, standalone: true })
export class ValueItemNamePipe extends ValueItemBase implements PipeTransform {
  pluckValue(valueItem: ValueItem, lang: Lang): string {
    return getValueItemName(valueItem, lang);
  }
}

@Pipe({ name: 'valueItemDescription', pure: false, standalone: true })
export class ValueItemDescriptionPipe extends ValueItemBase implements PipeTransform {
  pluckValue(valueItem: ValueItem, lang: Lang): string {
    return getValueItemDescription(valueItem, lang);
  }
}

export function getValueItemName(valueItem: ValueItem, lang: Lang): string {
  return valueItem[getValueItemNameKey(lang)];
}

export function getValueItemDescription(valueItem: ValueItem, lang: Lang): string {
  return valueItem[getValueItemDescriptionKey(lang)];
}

export const getValueItemName$ = (lang$: Observable<Lang>) => (valueItem: ValueItem) =>
  lang$.pipe(map((lang) => getValueItemName(valueItem, lang)));

export const getValueItemDescription$ = (lang$: Observable<Lang>) => (valueItem: ValueItem) =>
  lang$.pipe(map((lang) => getValueItemDescription(valueItem, lang)));
