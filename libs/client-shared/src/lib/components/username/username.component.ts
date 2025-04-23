import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { User } from '@asset-sg/shared/v2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, Observable, of } from 'rxjs';

@Component({
  selector: 'asset-sg-username',
  imports: [CommonModule, TranslateModule],
  templateUrl: './username.component.html',
  styleUrl: './username.component.scss',
  standalone: true,
})
export class UsernameComponent implements OnInit {
  @Input({ required: true })
  user!: UserWithName | null;

  name$!: Observable<string>;

  private readonly translateService = inject(TranslateService);

  ngOnInit(): void {
    this.name$ = getUsernameHTML(this.translateService, this.user);
  }
}

type UserWithName = Pick<User, 'firstName' | 'lastName'>;

export const getUsernameHTML = (translateService: TranslateService, user: UserWithName | null): Observable<string> =>
  user === null
    ? translateService.get('deletedUserName').pipe(map((it) => `${it}`))
    : of(`${user.firstName} ${user.lastName}`);
