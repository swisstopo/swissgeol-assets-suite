import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '@asset-sg/auth';

@Component({
  selector: 'asset-sg-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
})
export class ErrorComponent {
  errorMessage: string;
  private readonly _authService = inject(AuthService);

  constructor(private route: ActivatedRoute, private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    console.log(navigation?.extras.state?.['errorMessage']);
    this.errorMessage = navigation?.extras.state?.['errorMessage'] ?? 'An error occurred, please try again later.';
  }

  public logout() {
    this._authService.logOut();
  }
}
