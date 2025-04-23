import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetFileType, LegalDocItemCode } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatestWith, map, Observable, startWith, Subscription, tap } from 'rxjs';
import { AssetForm, FormAssetFile } from '../../asset-editor-page/asset-editor-page.component';
import {
  mapValueItemsToTranslatedItem,
  TranslatedValueItem,
} from '../asset-editor-general/asset-editor-general.component';

@Component({
  selector: 'asset-sg-editor-files',
  styleUrls: ['./asset-editor-files.component.scss'],
  templateUrl: './asset-editor-files.component.html',
  standalone: false,
})
export class AssetEditorFilesComponent implements OnInit, OnDestroy {
  @Input() form!: AssetForm['controls']['files'];
  public isDragging = false;
  public isFileTooLarge = false;
  protected readonly searchTerm$ = new BehaviorSubject<string>('');
  protected readonly fileType$ = new BehaviorSubject<AssetFileType>('Normal');
  public legalFiles: FormControl<FormAssetFile>[] = [];
  public normalFiles: FormControl<FormAssetFile>[] = [];
  protected dataSource: MatTableDataSource<FormControl<FormAssetFile>> = new MatTableDataSource();
  private readonly COLUMNS = ['select', 'name', 'lastModifiedAt', 'legalDocItemCode'];
  public displayedColumns: string[] = this.COLUMNS.filter((col) => col !== 'legalDocItemCode');
  private readonly store = inject(Store);
  public legalDocItems: TranslatedValueItem[] = [];
  public readonly legalDocItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectLegalDocItems)
    .pipe(map(mapValueItemsToTranslatedItem));
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(
      this.form.controls.testFiles.valueChanges.pipe(startWith(this.form.controls.testFiles.controls)).subscribe(() => {
        this.setDataSource(this.form.controls.testFiles.controls);
      }),
    );
    this.subscriptions.add(
      this.searchTerm$
        .pipe(
          combineLatestWith(this.fileType$),
          tap(([searchTerm, fileType]) => {
            const data = fileType === 'Normal' ? this.normalFiles : this.legalFiles;
            this.displayedColumns =
              fileType === 'Normal' ? [...this.COLUMNS.filter((col) => col !== 'legalDocItemCode')] : this.COLUMNS;
            this.dataSource.data = data.filter((file) => {
              return file.value.name.toLowerCase().includes(searchTerm.toLowerCase());
            });
          }),
        )
        .subscribe(),
    );
    this.subscriptions.add(this.legalDocItems$.subscribe((items) => (this.legalDocItems = items)));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public setDataSource(controls: FormControl<FormAssetFile>[]) {
    this.legalFiles = controls?.filter((control) => control.value.type === 'Legal') ?? [];
    this.normalFiles = controls?.filter((control) => control.value.type === 'Normal') ?? [];
    this.dataSource.data = this.fileType$.value === 'Legal' ? this.legalFiles : this.normalFiles;
  }

  get areButtonsDisabled(): boolean {
    return !this.dataSource.data.some((file) => file.value.selected);
  }

  public onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  public onDragLeave() {
    this.isDragging = false;
  }

  public onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(files);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(input.files);
    }
  }

  private handleFiles(files: FileList) {
    for (const element of Array.from(files)) {
      if (element.size > 2000 * 1024 * 1024) {
        this.isFileTooLarge = true;
        return;
      }
      this.isFileTooLarge = false;
      this.form.controls.testFiles.push(
        new FormControl(
          {
            id: 0,
            name: element.name,
            size: element.size,
            legalDocItemCode: null as unknown as LegalDocItemCode,
            type: this.fileType$.value,
            selected: false,
            willBeDeleted: false,
            file: element,
          },
          { nonNullable: true },
        ),
      );
    }
  }

  public setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  public switchFileType() {
    if (this.fileType$.value === 'Normal') {
      this.fileType$.next('Legal');
    } else {
      this.fileType$.next('Normal');
    }
  }

  public updateLegalDocItemCode(control: FormControl<FormAssetFile>, event: LegalDocItemCode[]) {
    control.value.legalDocItemCode = event[0];
    this.form.markAsDirty();
  }

  public toggleAll(event: MatCheckboxChange) {
    this.form.controls.testFiles.value.forEach((file) => {
      file.selected = file.type === this.fileType$.value ? event.checked : file.selected;
    });
  }

  public selectFile(control: FormControl<FormAssetFile>, event: MatCheckboxChange) {
    control.value.selected = event.checked;
  }

  public selectFilesForDeletion() {
    this.form.controls.testFiles.setValue(
      this.form.controls.testFiles.value.map((file) => {
        if (file.type !== this.fileType$.value) {
          return file;
        }
        return {
          ...file,
          willBeDeleted: file.selected ? true : file.willBeDeleted,
        };
      }),
    );
    this.form.markAsDirty();
  }

  public downloadSelectedFiles() {}

  protected sortChange(sort: Sort): void {}
}
