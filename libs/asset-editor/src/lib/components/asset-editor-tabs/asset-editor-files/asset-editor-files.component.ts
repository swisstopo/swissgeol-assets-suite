import { HttpClient } from '@angular/common/http';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { AssetEditDetail, AssetFileType, LegalDocItemCode } from '@asset-sg/shared';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatestWith, forkJoin, map, Observable, startWith, Subscription, tap } from 'rxjs';
import { TranslatedValueItem } from '../../../models/translated-value-item.interface';
import { mapValueItemsToTranslatedItem } from '../../../utils/map-value-items-to-translated-item.utils';
import { AssetForm, FormAssetFile } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-files',
  styleUrls: ['./asset-editor-files.component.scss'],
  templateUrl: './asset-editor-files.component.html',
  standalone: false,
})
export class AssetEditorFilesComponent implements OnInit, OnDestroy {
  @Input() form!: AssetForm['controls']['files'];
  @Input() asset: AssetEditDetail | null = null;

  public activeFileDownload: Set<number> = new Set();

  protected readonly searchTerm$ = new BehaviorSubject<string>('');
  protected readonly fileType$ = new BehaviorSubject<AssetFileType>('Normal');

  public legalFiles: FormControl<FormAssetFile>[] = [];
  public normalFiles: FormControl<FormAssetFile>[] = [];

  protected dataSource: MatTableDataSource<FormControl<FormAssetFile>> = new MatTableDataSource();
  private readonly COLUMNS = ['select', 'name', 'lastModifiedAt', 'legalDocItemCode', 'ocrStatus'];
  public displayedColumns: string[] = this.COLUMNS.filter((col) => col !== 'legalDocItemCode');

  private readonly store = inject(Store);

  public legalDocItems: TranslatedValueItem[] = [];
  public readonly legalDocItems$: Observable<TranslatedValueItem[]> = this.store
    .select(fromAppShared.selectLegalDocItems)
    .pipe(map(mapValueItemsToTranslatedItem));

  private readonly httpClient = inject(HttpClient);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(
      this.form.controls.assetFiles.valueChanges
        .pipe(startWith(this.form.controls.assetFiles.controls))
        .subscribe(() => {
          this.setDataSource(this.form.controls.assetFiles.controls);
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

  get isDisabled(): boolean {
    return !this.dataSource.data.some((file) => file.value.selected);
  }

  public setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  public switchFileType(type: AssetFileType) {
    this.fileType$.next(type);
  }

  public updateLegalDocItemCode(control: FormControl<FormAssetFile>, event: LegalDocItemCode[]) {
    control.value.legalDocItemCode = event[0];
    this.form.markAsDirty();
  }

  public toggleAll(event: MatCheckboxChange) {
    this.form.controls.assetFiles.value.forEach((file) => {
      file.selected = file.type === this.fileType$.value ? event.checked : file.selected;
    });
  }

  public selectFile(control: FormControl<FormAssetFile>, event: MatCheckboxChange) {
    control.value.selected = event.checked;
  }

  public selectFilesForDeletion() {
    this.form.controls.assetFiles.setValue(
      this.form.controls.assetFiles.value.map((file) => {
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

  public downloadSelectedFiles() {
    if (!this.asset) {
      return;
    }
    const filesToDownload: SimpleFile[] = this.dataSource.data
      .filter((file) => file.value.selected && file.value.id !== 0)
      .map((file) => ({
        name: file.value.name,
        id: file.value.id,
      }));

    const assetId = this.asset.assetId;
    const downloadRequests: Observable<FileBlob>[] = filesToDownload.map((file) => {
      this.activeFileDownload.add(file.id);
      return this.httpClient.get(`/api/assets/${assetId}/files/${file.id}`, { responseType: 'blob' }).pipe(
        map((blob) => {
          return {
            blob,
            file,
          };
        }),
      );
    });

    forkJoin(downloadRequests).subscribe((fileBlobs: FileBlob[]) => {
      fileBlobs.forEach(async (fileBlob: FileBlob) => {
        await triggerDownload(fileBlob);
        this.activeFileDownload.delete(fileBlob.file.id);
      });
    });
  }

  protected sortChange(sort: Sort): void {
    const data = this.dataSource.data.slice();
    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    });
  }
}

interface SimpleFile {
  name: string;
  id: number;
}

interface FileBlob {
  blob: Blob;
  file: SimpleFile;
}

const triggerDownload = async ({ blob, file }: FileBlob) => {
  const isPdf = file.name.endsWith('.pdf');
  if (isPdf) {
    blob = await blob.arrayBuffer().then((buffer) => new Blob([buffer], { type: 'application/pdf' }));
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.setAttribute('style', 'display: none');
  anchor.href = url;
  if (!isPdf) {
    anchor.download = file.name;
  } else {
    anchor.target = '_blank';
  }
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  });
};
