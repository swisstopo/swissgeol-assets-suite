import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@asset-sg/auth';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'asset-sg-redirect-to-lang',
  template: 'Redirect to main page...',
})
export class RedirectToLangComponent {
  constructor(router: Router, authService: AuthService) {
    authService.isInitialized$.subscribe((isInitialized) => {
      if (isInitialized) {
        router.navigate(['/de'], { queryParamsHandling: 'merge' });
      }
    });
  }
}
