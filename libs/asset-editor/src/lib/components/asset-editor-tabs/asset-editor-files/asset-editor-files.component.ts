import { HttpClient } from '@angular/common/http';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Asset, LegalDocCode, LocalizedItem } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatestWith,
  filter,
  forkJoin,
  map,
  Observable,
  startWith,
  Subscription,
  tap,
} from 'rxjs';
import { AssetForm, AssetFormFile, ExistingAssetFile } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-files',
  styleUrls: ['./asset-editor-files.component.scss'],
  templateUrl: './asset-editor-files.component.html',
  standalone: false,
})
export class AssetEditorFilesComponent implements OnInit, OnDestroy {
  @Input() form!: AssetForm['controls']['files'];
  @Input() asset: Asset | null = null;

  public activeFileDownloads: Set<number> = new Set();

  protected readonly searchTerm$ = new BehaviorSubject<string>('');
  protected readonly isLegal$ = new BehaviorSubject(false);

  private selectedFiles = new Set<AssetFormFile>();

  protected readonly dataSource = new MatTableDataSource<FormControl<AssetFormFile>>();
  private readonly COLUMNS = ['select', 'name', 'lastModifiedAt', 'legalDocCode', 'ocrStatus'];
  public displayedColumns: string[] = this.COLUMNS.filter((col) => col !== 'legalDocCode');

  private readonly store = inject(Store);

  public readonly legalDocItems$: Observable<Array<LocalizedItem<LegalDocCode>>> = this.store
    .select(fromAppShared.selectReferenceLegalDocCodes)
    .pipe(
      filter(isNotNull),
      map((it) => [...it.values()]),
    );

  private readonly httpClient = inject(HttpClient);
  private readonly subscriptions: Subscription = new Subscription();

  public ngOnInit() {
    this.subscriptions.add(
      this.searchTerm$
        .pipe(
          map((it) => it.toLowerCase()),
          combineLatestWith(this.isLegal$, this.form.valueChanges.pipe(startWith(this.form.value))),
          tap(([searchTerm, isLegal]) => {
            this.displayedColumns = isLegal ? this.COLUMNS : this.COLUMNS.filter((col) => col !== 'legalDocCode');
            this.dataSource.data = this.form.controls.filter((control) => {
              const file = control.value;
              const isLegalFile = file.legalDocCode != null;
              if (isLegal !== isLegalFile) {
                return false;
              }
              const name = 'id' in file ? file.name : file.file.name;
              return name.toLowerCase().includes(searchTerm);
            });
          }),
        )
        .subscribe(),
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  get hasSelectedFiles(): boolean {
    return this.selectedFiles.size !== 0;
  }

  public setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  public setFileType({ isLegal }: { isLegal: boolean }) {
    if (isLegal === this.isLegal$.value) {
      return;
    }
    this.selectedFiles.clear();
    this.isLegal$.next(isLegal);
  }

  public updateLegalDocItemCode(control: FormControl<AssetFormFile>, [code]: LegalDocCode[]) {
    const file = { ...control.value, legalDocCode: code };
    control.setValue(file);
    if (this.selectedFiles.delete(control.value)) {
      this.selectedFiles.add(file);
    }
    this.form.markAsDirty();
  }

  public toggleAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedFiles = new Set(this.form.value.filter((file) => this.isVisible(file)));
    } else {
      this.selectedFiles.clear();
    }
  }

  public selectFile(control: FormControl<AssetFormFile>, event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedFiles.add(control.value);
    } else {
      this.selectedFiles.delete(control.value);
    }
  }

  public isSelected(file: AssetFormFile): boolean {
    return this.selectedFiles.has(file);
  }

  public get areAllFilesSelected(): boolean {
    return this.selectedFiles.size === this.form.value.length;
  }

  public markSelectedFilesForDeletion() {
    this.transformSelectedFiles((file) => ({ ...file, shouldBeDeleted: true }));
  }

  private transformSelectedFiles(transform: (file: AssetFormFile) => AssetFormFile): void {
    this.form.setValue(
      this.form.value.map((file) => {
        if (!this.selectedFiles.delete(file)) {
          return file;
        }
        const updatedFile = transform(file);
        this.selectedFiles.add(updatedFile);
        return updatedFile;
      }),
    );
    this.form.markAsDirty();
  }

  private isVisible(file: AssetFormFile): boolean {
    return (file.legalDocCode !== null) === this.isLegal$.value;
  }

  public downloadSelectedFiles() {
    if (!this.asset) {
      return;
    }
    const filesToDownload: ExistingAssetFile[] = this.dataSource.data
      .map((control) => control.value)
      .filter((file): file is ExistingAssetFile => 'id' in file && this.selectedFiles.has(file));

    const { id: assetId } = this.asset;
    const downloadRequests: Array<Observable<FileBlob>> = filesToDownload.map((file) => {
      this.activeFileDownloads.add(file.id);
      return this.httpClient.get(`/api/assets/${assetId}/files/${file.id}`, { responseType: 'blob' }).pipe(
        map((blob) => {
          return {
            blob,
            file,
          };
        }),
      );
    });

    forkJoin(downloadRequests).subscribe((fileBlobs) => {
      fileBlobs.forEach(async (fileBlob: FileBlob) => {
        await triggerDownload(fileBlob);
        this.activeFileDownloads.delete(fileBlob.file.id);
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

interface FileBlob {
  blob: Blob;
  file: ExistingAssetFile;
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
