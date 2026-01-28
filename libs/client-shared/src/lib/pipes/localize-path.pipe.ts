import { ChangeDetectorRef, inject, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '../services/language.service';

const CACHE = new Map<string | string[], string[]>();

@Pipe({ name: 'localizePath', pure: false, standalone: true })
export class LocalizePathPipe implements PipeTransform, OnDestroy {
  private readonly languageService = inject(LanguageService);
  private readonly cdRef = inject(ChangeDetectorRef);

  private readonly subscription = new Subscription();

  constructor() {
    this.subscription.add(
      this.languageService.language$.subscribe(() => {
        CACHE.clear();
        this.cdRef.markForCheck();
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  transform(value: string | string[]): string[] {
    const path = makePath(value);
    const result = CACHE.get(path);
    if (result !== undefined) {
      return result;
    }

    const { language } = this.languageService;
    const segments = [joinPath(`/${language}`, path)];

    CACHE.set(path, segments);
    return segments;
  }
}

const makePath = (value: string | string[]): string => {
  return typeof value === 'string' ? joinPath('/', value) : value.reduce((left, right) => joinPath(left, right), '/');
};

const joinPath = (left: string, right: string): string => {
  const hasLeft = left[left.length - 1] === '/';
  const hasRight = right[0] === '/';
  if (hasLeft) {
    return hasRight ? `${left}${right.slice(1)}` : `${left}${right}`;
  }
  return hasRight ? `${left}${right}` : `${left}/${right}`;
};
