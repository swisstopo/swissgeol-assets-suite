import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class ErrorService {
  private message$ = new BehaviorSubject<string | null>(null);

  get onMessage(): Observable<string | null> {
    return this.message$.asObservable();
  }

  updateMessage(message: string) {
    this.message$.next(message);
  }

  clear(): void {
    this.message$.next(null);
  }
}
