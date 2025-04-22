import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';
import { FormItemWrapperComponent } from '../form-item-wrapper/form-item-wrapper.component';

@Component({
  selector: 'asset-sg-text-area',
  templateUrl: './text-area.component.html',
  styleUrls: ['./text-area.component.scss'],
  standalone: true,
  imports: [TranslateModule, FormsModule, MatInput, FormItemWrapperComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TextAreaComponent,
      multi: true,
    },
  ],
})
export class TextAreaComponent implements ControlValueAccessor, AfterViewInit {
  @Input() public title = '';
  @Input() public value = '';
  @Input({ transform: coerceBooleanProperty }) public isRequired = false;
  @Input() public placeholder = '';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  private onChange: (value: string) => void = noop;
  private onTouched: () => void = noop;

  public ngAfterViewInit() {
    this.resize();
  }

  public writeValue(value: string) {
    this.value = value;
    setTimeout(() => this.resize(), 0);
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public changeTerm(value: string): void {
    if (this.value !== value) {
      this.value = value;
      this.valueChange.emit(value);
      this.onChange(value);
    }
  }

  public onBlur(): void {
    this.onTouched();
  }

  private resize() {
    if (this.textarea) {
      const element = this.textarea.nativeElement;
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    }
  }
}
