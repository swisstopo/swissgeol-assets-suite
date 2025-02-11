import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { OnChange, OnTouched, ValueItemNamePipe } from '@asset-sg/client-shared';
import { ValueItem, ValueItemRecord, valueItemRecordToArray } from '@asset-sg/shared';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { noop } from 'rxjs';

@Component({
  standalone: true,
  selector: 'asset-sg-multiselect',
  templateUrl: './asset-multiselect.component.html',
  styleUrls: ['./asset-multiselect.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    ValueItemNamePipe,
    SvgIconComponent,
  ],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AssetMultiselectComponent), multi: true }],
  host: { class: 'flex flex-column' },
})
export class AssetMultiselectComponent implements ControlValueAccessor {
  public _itemsArray: ValueItem[] = [];

  private _onChange: OnChange = noop;
  private _onTouched: OnTouched = noop;
  public _disabled = false;
  private _cd = inject(ChangeDetectorRef);

  @Input()
  public get items(): ValueItemRecord {
    return this._items;
  }
  public set items(value: ValueItemRecord) {
    this._items = value;
    this._itemsArray = valueItemRecordToArray(value);
  }
  private _items: ValueItemRecord = {};

  @Input() fallbackCode: string | undefined = undefined;

  @Input() singularLabel: string | undefined = undefined;
  @Input() pluralLabel: string | undefined = undefined;
  @Input() noSelectedItemsLabel: string | undefined = undefined;
  @Input() placeholder: string | undefined = undefined;

  public _selectedItemCodes: string[] = [];

  public _setSelectedItemCodes(codes: string[]) {
    this._selectedItemCodes = codes;
    if (this._selectedItemCodes.length > 1) {
      this._selectedItemCodes = this._selectedItemCodes.filter((c) => c !== this.fallbackCode);
    }
    this._onChange(this._selectedItemCodes);
  }

  public _removeItem(code: string): void {
    this._selectedItemCodes = this._selectedItemCodes.filter((c) => c !== code);
    if (this._selectedItemCodes.length === 0 && this.fallbackCode !== undefined) {
      this._selectedItemCodes = [this.fallbackCode];
    }
    this._onChange(this._selectedItemCodes);
  }

  setDisabledState(isDisabled: boolean) {
    this._disabled = isDisabled;
    this._cd.detectChanges();
  }

  writeValue(codes: string[]): void {
    this._selectedItemCodes = codes;
  }
  registerOnChange(fn: OnChange): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: OnTouched): void {
    this._onTouched = fn;
  }
}
