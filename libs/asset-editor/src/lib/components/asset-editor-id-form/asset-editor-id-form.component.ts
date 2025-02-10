import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as O from 'fp-ts/Option';
import { Subscription } from 'rxjs';
import { eqIdVM, IdVM } from '../../models';

@Component({
  selector: 'asset-sg-asset-editor-id-form',
  templateUrl: './asset-editor-id-form.component.html',
  styleUrls: ['./asset-editor-id-form.component.scss'],
  standalone: false,
})
export class AssetEditorIdFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true })
  public value!: IdVM | null;

  @Input()
  public isStandalone = false;

  @Input()
  public isDisabled = false;

  @Output()
  public save = new EventEmitter<IdVM>();

  @Output()
  public delete = new EventEmitter<IdVM>();

  @Output()
  public finish = new EventEmitter<void>();

  private _valueAsVM: Partial<IdVM> | null = null;

  public readonly form = new FormGroup({
    id: new FormControl<number | null>(null),
    value: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true,
      updateOn: 'blur',
    }),
    description: new FormControl('', { nonNullable: true }),
  });

  private readonly subscription = new Subscription();

  public ngOnInit(): void {
    // If this is the only persisted id, we write it to the parent form
    // without requiring the save button to be pressed.
    this.form.valueChanges.subscribe(() => {
      if (this.isStandalone) {
        this.writeValue();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('value' in changes) {
      this.syncFormFieldsWithValue();
    }
    if ('isDisabled' in changes) {
      if (this.isDisabled) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    }
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get isNew(): boolean {
    return this.value == null;
  }

  private get valueAsVM(): Partial<IdVM> {
    const { id, value, description } = this.form.value;
    const idVM: Partial<IdVM> = {
      idId: makeIdId(id),
      id: value,
      description,
    };
    const { _valueAsVM: current } = this;
    if (current != null && eqIdVM.equals(current as IdVM, idVM as IdVM)) {
      return current;
    }
    this._valueAsVM = idVM;
    return idVM;
  }

  public saveForm(): void {
    this.writeValue();
    this.finish.emit();
  }

  public cancel(): void {
    this.finish.emit();
  }

  private syncFormFieldsWithValue(): void {
    const { value } = this;
    if (value === this._valueAsVM) {
      return;
    }

    this.form.reset();
    if (value == null) {
      this._valueAsVM = null;
      return;
    }
    this.form.setValue({
      id: O.toNullable(value.idId),
      value: value.id,
      description: value.description,
    });
    this._valueAsVM = value;
  }

  private writeValue(): void {
    if (this.form.valid) {
      // Write the changes to the parent form.
      const value = this.valueAsVM as IdVM;
      this.save.emit(value);
    } else if (this.isStandalone && this.value != null && this.form.value.value === '') {
      // Remove new records from the parent form
      this.delete.emit(this.value);
    }
  }
}

const makeIdId = (id: number | null | undefined): O.Option<number> | undefined => {
  switch (id) {
    case undefined:
      return undefined;
    case null:
      return O.none;
    default:
      return O.some(id);
  }
};
