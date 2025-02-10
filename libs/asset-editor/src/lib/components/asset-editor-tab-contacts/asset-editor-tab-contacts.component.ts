import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroupDirective, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { fromAppShared } from '@asset-sg/client-shared';
import { ordStringLowerCase } from '@asset-sg/core';
import {
  AssetContactEdit,
  AssetContactRole,
  Contact,
  ContactEdit,
  eqAssetContactEdit,
  PatchContact,
} from '@asset-sg/shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RxState } from '@rx-angular/state';
import * as A from 'fp-ts/Array';
import { pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import { Ord as ordNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import { contramap } from 'fp-ts/Ord';
import * as R from 'fp-ts/Record';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  identity,
  map,
  Observable,
  skip,
  Subject,
  switchMap,
  take,
} from 'rxjs';

import {
  AssetEditorContactsFormGroup,
  AssetEditorFormGroup,
  isAssetEditorFormDisabled$,
} from '../asset-editor-form-group';

type UIMode = 'view' | 'linkExisting' | 'linkNew' | 'viewContactDetails' | 'editContactDetails';

interface TabContactsState {
  referenceDataVM: fromAppShared.ReferenceDataVM;
  assetContacts: AssetContactEdit[];
  currentContactId: O.Option<number>;
  uiMode: UIMode;
}

const initialTabContactsState: TabContactsState = {
  referenceDataVM: fromAppShared.emptyReferenceDataVM,
  assetContacts: [],
  currentContactId: O.none,
  uiMode: 'view',
};

interface AssetContact {
  role: string;
  contact: ContactEdit;
}

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-tab-contacts',
  templateUrl: './asset-editor-tab-contacts.component.html',
  styleUrls: ['./asset-editor-tab-contacts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'edit-area' },
  providers: [RxState],
  standalone: false,
})
export class AssetEditorTabContactsComponent implements OnInit {
  private _rootFormGroupDirective = inject(FormGroupDirective);
  private rootFormGroup = this._rootFormGroupDirective.control as AssetEditorFormGroup;
  private _formBuilder = inject(FormBuilder);

  // eslint-disable-next-line @angular-eslint/no-output-rename
  @Output('editContact') public editContact$ = new EventEmitter<ContactEdit>();
  // eslint-disable-next-line @angular-eslint/no-output-rename
  @Output('createContact') public createContact$ = new EventEmitter<PatchContact>();

  public _form!: AssetEditorContactsFormGroup;

  public _linkContactForm = this._formBuilder.group({
    role: new FormControl<AssetContactRole | null>(null, Validators.required),
    contactId: new FormControl<number | null>(null, Validators.required),
  });

  public readonly disableAll$ = isAssetEditorFormDisabled$(this.rootFormGroup);

  private _contactFormCommon = () => ({
    name: new FormControl<string>('', { nonNullable: true, validators: Validators.required }),
    street: new FormControl<string | null>(null),
    houseNumber: new FormControl<string | null>(null),
    plz: new FormControl<string | null>(null),
    locality: new FormControl<string | null>(null),
    country: new FormControl<string | null>(null),
    telephone: new FormControl<string | null>(null),
    email: new FormControl<string | null>(null),
    website: new FormControl<string | null>(null),
    contactKindItemCode: new FormControl<string>('unknown', { nonNullable: true, validators: Validators.required }),
  });

  public _linkNewContactForm = this._formBuilder.group({
    role: new FormControl<AssetContactRole | null>(null, Validators.required),
    ...this._contactFormCommon(),
  });

  public _currentContactForm = this._formBuilder.group(this._contactFormCommon());

  private _state: RxState<TabContactsState> = inject(RxState<TabContactsState>);

  public _assetContacts$ = this._state.select(
    ['assetContacts', 'referenceDataVM'],
    ({ assetContacts, referenceDataVM }) =>
      pipe(
        assetContacts,
        A.map((ac) =>
          pipe(
            referenceDataVM.contacts,
            R.lookup(String(ac.contactId)),
            O.map((contact) => ({ ...ac, contact }))
          )
        ),
        A.compact,
        A.sortBy([
          contramap((ac: AssetContact) => ac.role)(ordStringLowerCase),
          contramap((ac: AssetContact) => ac.contact.name)(ordStringLowerCase),
          contramap((ac: AssetContact) => ac.contact.id)(ordNumber),
        ])
      )
  );

  public _availableContacts$ = this._state.select(['assetContacts', 'referenceDataVM', 'uiMode'], identity).pipe(
    switchMap(({ uiMode, assetContacts, referenceDataVM }) => {
      if (uiMode === 'view') return EMPTY;
      return (
        uiMode === 'linkExisting'
          ? this._linkContactForm.controls['role'].valueChanges.pipe(distinctUntilChanged())
          : this._linkNewContactForm.controls['role'].valueChanges.pipe(distinctUntilChanged())
      ).pipe(map((role) => ({ role, assetContacts, referenceDataVM })));
    }),
    map(({ role, assetContacts, referenceDataVM }) => {
      if (role === null) return [];
      return pipe(
        referenceDataVM.contactsArray,
        A.filter((c) => !assetContacts.filter((ac) => ac.role == role).some((ac) => ac.contactId === c.id)),
        A.sortBy([
          contramap((ac: Contact) => ac.name)(ordStringLowerCase),
          contramap((ac: Contact) => ac.id)(ordNumber),
        ])
      );
    })
  );

  public _contactKinds$ = this._state
    .select('referenceDataVM')
    .pipe(map((referenceDataVM) => referenceDataVM.contactKindItemsArray));

  public _uiMode$ = this._state.select('uiMode');

  public _currentContactId$ = this._state.select('currentContactId');

  readonly contactQuery$ = new Subject<string>();

  readonly contacts$ = combineLatest([
    this.contactQuery$.pipe(debounceTime(300)),
    this._state.select('referenceDataVM').pipe(map((data) => Object.values(data.contacts))),
  ]).pipe(
    map(([query, contacts]) => {
      if (query.length < 3) {
        return contacts;
      }
      query = query.toLocaleLowerCase();
      return contacts.filter((it) => it.name.toLocaleLowerCase().includes(query));
    })
  );

  public getForm(uiMode: UIMode) {
    switch (uiMode) {
      case 'linkExisting':
        return this._linkContactForm;
      case 'linkNew':
        return this._linkNewContactForm;
      case 'viewContactDetails':
      case 'editContactDetails':
        return this._currentContactForm;
      default:
        return null;
    }
  }

  @Input()
  public set referenceDataVM$(value: Observable<fromAppShared.ReferenceDataVM>) {
    this._state.connect('referenceDataVM', value);
  }

  constructor() {
    this._state.set(initialTabContactsState);
  }

  ngOnInit(): void {
    this._form = this.rootFormGroup.get('contacts') as AssetEditorContactsFormGroup;
    this._state.set({ assetContacts: this._form.getRawValue().assetContacts });
    this._state
      .select('assetContacts')
      .pipe(skip(1), untilDestroyed(this))
      .subscribe((assetContacts) => {
        this._form.patchValue({ assetContacts });
        this._form.markAsDirty();
      });
  }

  linkContact() {
    this._linkContactForm.reset();
    this._state.set({ uiMode: 'linkExisting' });
  }

  link() {
    if (this._linkContactForm.invalid) {
      this._linkContactForm.markAllAsTouched();
      return;
    }
    const { contactId, role } = this._linkContactForm.getRawValue();
    if (contactId && role) {
      this._state.set((s) => ({
        ...s,
        assetContacts: pipe(s.assetContacts, A.append({ contactId, role }), A.uniq(eqAssetContactEdit)),
        uiMode: 'view',
      }));
    }
  }

  showContact(contactId: number) {
    this._state.set({ uiMode: 'viewContactDetails', currentContactId: O.some(contactId) });
    this._currentContactForm.patchValue(this._state.get().referenceDataVM.contacts[String(contactId)]);
    this._currentContactForm.disable();
  }

  editCurrentContact() {
    this._state.set({ uiMode: 'editContactDetails' });
    this._currentContactForm.enable();
  }

  unlinkContact(contact: AssetContact): void {
    this._state.set((s) => ({
      ...s,
      assetContacts: s.assetContacts.filter((c) => c.contactId !== contact.contact.id || c.role !== contact.role),
      ...pipe(
        s.currentContactId,
        O.filter((c) => c === contact.contact.id),
        O.map(() => ({ currentContactId: O.none, uiMode: 'view' as UIMode })),
        O.getOrElse(() => ({ currentContactId: s.currentContactId, uiMode: s.uiMode }))
      ),
    }));
  }

  cancelLink() {
    this._state.set({ uiMode: 'view' });
  }

  createNewContact() {
    this._linkNewContactForm.reset();
    this._state.set({ uiMode: 'linkNew' });
  }

  cancelEditCurrentContact() {
    this._state.set({ uiMode: 'viewContactDetails' });
    const currentContactId = this._state.get().currentContactId;
    if (O.isSome(currentContactId)) {
      this._currentContactForm.patchValue(this._state.get().referenceDataVM.contacts[String(currentContactId.value)]);
    }
    this._currentContactForm.disable();
  }

  closeCurrentContact() {
    this._state.set({ uiMode: 'view', currentContactId: O.none });
  }

  saveCurrentContact() {
    const currentContactId = this._state.get().currentContactId;
    if (O.isSome(currentContactId)) {
      this.editContact$.next({ id: currentContactId.value, ...this._currentContactForm.getRawValue() });
    }
    this._currentContactForm.disable();
    this._state.set({ uiMode: 'viewContactDetails' });
  }

  submitNewContact() {
    if (this._linkNewContactForm.invalid) {
      this._linkNewContactForm.markAllAsTouched();
      return;
    }
    const { role, ...rest } = this._linkNewContactForm.getRawValue();
    if (!role) return;

    this._state
      .select('referenceDataVM')
      .pipe(skip(1), take(1), untilDestroyed(this))
      .subscribe((referenceDataVM) => {
        const newContact = pipe(
          referenceDataVM.contactsArray,
          A.sort(contramap((c: Contact) => c.id)(ordNumber)),
          NEA.fromArray,
          O.map(NEA.last)
        );
        if (O.isSome(newContact)) {
          this._state.set((s) => ({
            ...s,
            assetContacts: pipe(
              s.assetContacts,
              A.append({ contactId: newContact.value.id, role }),
              A.uniq(eqAssetContactEdit)
            ),
            uiMode: 'view',
          }));
        }
      });

    this.createContact$.next(rest);
  }

  displayContact(contact: Contact): string {
    return contact.name;
  }

  onContactSelected(event: MatAutocompleteSelectedEvent) {
    this._linkContactForm.controls.contactId.setValue((event.option.value as Contact).id);
  }
}
