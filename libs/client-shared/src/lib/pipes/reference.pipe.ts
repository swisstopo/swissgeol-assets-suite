import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Lang } from '@asset-sg/shared';
import {
  Contact,
  ContactId,
  ContactKindCode,
  LanguageCode,
  LegalDocCode,
  LocalizedItem,
  LocalizedItemCode,
  ReferenceDataMapping,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { selectReferenceData } from '../state/app-shared-state.selectors';

@Pipe({ name: 'reference', pure: false, standalone: true })
export class ReferencePipe implements PipeTransform, OnDestroy {
  private readonly store = inject(Store);
  private readonly translateService = inject(TranslateService);
  private readonly cdRef = inject(ChangeDetectorRef);

  private readonly referenceData$ = this.store.select(selectReferenceData);
  private referenceData: ReferenceDataMapping | null = null;

  private readonly subscription = new Subscription();

  constructor() {
    this.subscription.add(
      this.translateService.onLangChange.subscribe(() => {
        this.cdRef.markForCheck();
      }),
    );
    this.subscription.add(
      this.referenceData$.subscribe((data) => {
        this.referenceData = data;
        this.cdRef.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  transform(value: LocalizedItemCode, key: 'nationalInterestTypes'): string;
  transform(value: LocalizedItemCode, key: 'assetTopics'): string;
  transform(value: LocalizedItemCode, key: 'assetFormats'): string;
  transform(value: LocalizedItemCode, key: 'assetKinds'): string;
  transform(value: ContactKindCode, key: 'contactKinds'): string;
  transform(value: LanguageCode, key: 'languages'): string;
  transform(value: LegalDocCode, key: 'legalDocs'): string;
  transform(value: ContactId, key: 'contacts'): string;
  transform(value: LocalizedItemCode | ContactId, key: keyof ReferenceDataMapping): string {
    if (this.referenceData === null) {
      return '';
    }
    const mapping = this.referenceData[key];
    if (key === 'contacts') {
      const contact = (mapping as Map<ContactId, Contact>).get(value as ContactId);
      return contact?.name ?? '';
    }
    const item = (mapping as Map<LocalizedItemCode, LocalizedItem>).get(value as LocalizedItemCode);
    if (item === undefined) {
      return '';
    }
    const text = item.name[this.translateService.currentLang as Lang];
    return text ?? item.name.default;
  }
}
