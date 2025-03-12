import { Component, HostBinding, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as O from 'fp-ts/Option';
import { IdVM } from '../../models';

@Component({
  selector: 'asset-sg-asset-editor-id-list',
  templateUrl: './asset-editor-id-list.component.html',
  styleUrls: ['./asset-editor-id-list.component.scss'],
  standalone: false,
})
export class AssetEditorIdListComponent {
  @Input({ required: true })
  public control!: FormControl<IdVM[]>;

  private _formValue: NewId | IdVM | null = null;

  get ids(): IdVM[] {
    return this.control.value;
  }

  @HostBinding('class.is-editing')
  get isFormOpen(): boolean {
    return this._formValue !== null || this.ids.length <= 1;
  }

  get formValue(): IdVM | null {
    if (this._formValue === null) {
      return this.ids.length === 1 ? this.ids[0] : null;
    }
    return this._formValue === NewId ? null : this._formValue;
  }

  get isNewFormOpen(): boolean {
    return this._formValue === NewId;
  }

  isFormValue(id: IdVM): boolean {
    return this._formValue === null || this._formValue === NewId
      ? false
      : O.toNullable(id.idId) === O.toNullable(this._formValue.idId);
  }

  openForm(id?: IdVM): void {
    this._formValue = id ?? NewId;
  }

  saveId(id: IdVM): void {
    const { formValue: oldId } = this;
    if (oldId == null) {
      this.control.setValue([...this.ids, id]);
      return;
    }
    this.mutateId(oldId, (ids, i) => {
      ids[i] = id;
    });
    this._formValue = id;
  }

  deleteId(id: IdVM): void {
    this.mutateId(id, (ids, i) => {
      ids.splice(i, 1);
    });
    this._formValue = null;
  }

  private mutateId(id: IdVM, action: (ids: IdVM[], index: number) => void) {
    const i = this.ids.indexOf(id);
    if (i < 0) {
      return;
    }
    const newIds = [...this.ids];
    action(newIds, i);
    this.control.setValue(newIds);
  }

  closeForm(): void {
    this._formValue = null;
  }

  delete(id: IdVM): void {
    const i = this.ids.indexOf(id);
    const ids = [...this.ids];
    ids.splice(i, 1);
    this.control.setValue(ids);
    this.control.markAsDirty();
  }
}

/**
 * Symbol that signals that the id form should create a new record
 * instead of modifying an existing one.
 * */
const NewId = Symbol('NewId');
type NewId = typeof NewId;
