import { AfterContentInit, Component, ContentChildren, forwardRef, QueryList, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { noop } from 'rxjs';

@Component({
  selector: 'asset-sg-checklist-item, asset-sg-checklist-header',
  standalone: true,
  imports: [MatCheckbox, TranslateModule, FormsModule],
  templateUrl: './checklist-item.component.html',
  styleUrl: './checklist-item.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChecklistItemComponent),
      multi: true,
    },
  ],
})
export class ChecklistItemComponent implements AfterContentInit, ControlValueAccessor {
  /**
   * The checkbox's state.
   */
  state = CheckboxState.Unchecked;

  /**
   * The item's actual checkbox.
   * @private
   */
  @ViewChild(MatCheckbox, { static: true })
  private checkbox!: MatCheckbox;

  /**
   * The `ChecklistItemComponent` containing this one, if it exists.
   * If this is not set, then this item is on the topmost level.
   * @private
   */
  private parent: ChecklistItemComponent | null = null;

  /**
   * The checklist's children, i.e. the items nested within it.
   * @private
   */
  @ContentChildren(ChecklistItemComponent)
  private children!: QueryList<ChecklistItemComponent>;

  /**
   * How many of this item's children are currently checked (or indeterminate).
   * - If this is equal to `children.length`, the item is set to {@link CheckboxState.Checked}.
   * - Otherwise, if this is `0`, the item is set to {@link CheckboxState.Unchecked}.
   * - Otherwise, the item is set to {@link CheckboxState.Indeterminate}.
   *
   * @private
   */
  private activeChildCount = 0;

  private publishChange: (value: boolean) => void = noop;
  private publishTouch: () => void = noop;

  ngAfterContentInit(): void {
    for (const child of this.children) {
      child.setParent(this);
    }
  }

  setParent(parent: ChecklistItemComponent): void {
    this.parent = parent;
  }

  toggle(): void {
    switch (this.state) {
      case CheckboxState.Checked:
        this.setState(CheckboxState.Unchecked);
        break;
      case CheckboxState.Unchecked:
      case CheckboxState.Indeterminate:
        this.setState(CheckboxState.Checked);
        break;
    }
  }

  setState(state: CheckboxState, options: { preventUp?: boolean } = {}): void {
    const wasChecked = this.state !== CheckboxState.Unchecked;
    const isChecked = state !== CheckboxState.Unchecked;

    const wasFullyChecked = this.state === CheckboxState.Checked;
    const isFullyChecked = state === CheckboxState.Checked;

    this.state = state;
    this.checkbox.checked = isChecked;

    if (wasChecked !== isChecked && !options.preventUp) {
      this.parent?.handleChildChange(this);
    }

    if (wasFullyChecked !== isFullyChecked) {
      this.publishChange(isFullyChecked);
      this.publishTouch();

      const childState = state === CheckboxState.Unchecked ? CheckboxState.Unchecked : CheckboxState.Checked;
      for (const child of this.children) {
        child.setState(childState, { preventUp: true });
      }
      this.activeChildCount = isChecked ? this.children.length : 0;
    }
  }

  handleChildChange(child: ChecklistItemComponent): void {
    const wasChecked = this.state !== CheckboxState.Unchecked;
    const wasFullyChecked = this.state === CheckboxState.Checked;

    this.activeChildCount += child.state === CheckboxState.Unchecked ? -1 : 1;
    if (this.activeChildCount === 0) {
      this.state = CheckboxState.Unchecked;
    } else if (this.activeChildCount === this.children.length) {
      this.state = CheckboxState.Checked;
    } else {
      this.state = CheckboxState.Indeterminate;
    }
    const isChecked = this.state !== CheckboxState.Unchecked;
    const isFullyChecked = this.state === CheckboxState.Checked;
    if (wasChecked !== isChecked) {
      this.parent?.handleChildChange(this);
    }
    if (wasFullyChecked !== isFullyChecked) {
      this.publishChange(isFullyChecked);
      this.publishTouch();
    }
  }

  public writeValue(value: unknown): void {
    const isChecked = !!value;
    this.setState(isChecked ? CheckboxState.Checked : CheckboxState.Unchecked);
  }

  public registerOnChange(fn: (value: unknown) => void): void {
    this.publishChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.publishTouch = fn;
  }

  protected readonly CheckboxState = CheckboxState;
}

enum CheckboxState {
  /**
   * The checkbox is checked, i.e. active.
   */
  Checked,

  /**
   * The checkbox is unchecked, i.e. inactive.
   */
  Unchecked,

  /**
   * The checkbox is partially active, i.e. some, but not all, of its children are active.
   */
  Indeterminate,
}
