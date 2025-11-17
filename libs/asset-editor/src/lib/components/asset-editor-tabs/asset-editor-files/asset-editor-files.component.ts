import { HttpClient } from '@angular/common/http';
import { Component, inject, Input, OnChanges, OnDestroy, OnInit, signal, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  fromAppShared,
  PdfOverlayService,
  triggerDownload,
} from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import {
  Asset,
  AssetFile,
  AssetFileSignedUrl,
  FileProcessingStage,
  FileProcessingState,
  LegalDocCode,
  LocalizedItem,
  PageRangeClassification,
} from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import {
  BehaviorSubject,
  combineLatestWith,
  concatMap,
  delay,
  filter,
  firstValueFrom,
  from,
  map,
  Observable,
  startWith,
  Subscription,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { AssetForm, AssetFormFile, ExistingAssetFile } from '../../asset-editor-page/asset-editor-page.component';
import { PageRangeEditorComponent, PageRangeEditorData } from './page-range-editor/page-range-editor.component';

export const isExistingAssetFile: (file: AssetFormFile | AssetFile) => file is ExistingAssetFile = (
  file,
): file is ExistingAssetFile => 'id' in file;

export type FileProcessingStateMap = Map<
  number,
  { fileProcessingState: FileProcessingState; fileProcessingStage: FileProcessingStage | null }
>;

@Component({
  selector: 'asset-sg-editor-files',
  styleUrls: ['./asset-editor-files.component.scss'],
  templateUrl: './asset-editor-files.component.html',
  standalone: false,
})
export class AssetEditorFilesComponent implements OnInit, OnDestroy, OnChanges {
  @Input() form!: AssetForm['controls']['files'];
  @Input() asset: Asset | null = null;

  protected readonly fileProcessingStates = signal<FileProcessingStateMap>(new Map());
  protected readonly searchTerm$ = new BehaviorSubject<string>('');
  protected readonly isLegal$ = new BehaviorSubject(false);
  protected readonly dataSource = new MatTableDataSource<FormControl<AssetFormFile>>();
  protected readonly FileProcessingState: typeof FileProcessingState = FileProcessingState;
  protected readonly FileProcessingStage: typeof FileProcessingStage = FileProcessingStage;
  private selectedFiles = new Set<AssetFormFile>();
  private readonly COLUMNS = ['select', 'name', 'legalDocCode', 'processingState', 'actions'];
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
  private readonly dialogService: MatDialog = inject(MatDialog);
  private readonly pdfOverlayService = inject(PdfOverlayService);

  protected get hasSelectedFiles(): boolean {
    return this.selectedFiles.size !== 0;
  }

  protected get areAllFilesSelected(): boolean {
    return this.selectedFiles.size === this.form.value.length;
  }

  public async ngOnChanges(changes: SimpleChanges) {
    if (changes['asset'] && !changes['asset'].firstChange) {
      await this.fetchFileProcessingStates();
    }
  }

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

    this.subscriptions.add(
      timer(0, 5_000)
        .pipe(tap(() => this.fetchFileProcessingStates()))
        .subscribe(),
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  protected reanalyzeFile(file: ExistingAssetFile) {
    const dialogRef = this.dialogService.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          text: 'edit.tabs.files.pageRanges.confirmReanalyze',
          confirm: 'confirm',
        },
      },
    );
    this.subscriptions.add(
      dialogRef
        .afterClosed()
        .pipe(
          filter((hasConfirmed) => !!hasConfirmed && isNotNull(this.asset)),
          switchMap(() => {
            return this.httpClient.post<AssetFile>(`/api/assets/${this.asset!.id}/files/${file.id}/reanalyze`, null);
          }),
          tap((res) => {
            const index = this.form.value.findIndex((e) => e === file);
            const entry = this.form.at(index);
            entry.patchValue({ ...res, shouldBeDeleted: false });
            this.fileProcessingStates.update((current) => {
              const newMap = new Map(current);
              newMap.set(res.id, {
                fileProcessingState: res.fileProcessingState,
                fileProcessingStage: res.fileProcessingStage,
              });
              return newMap;
            });
          }),
        )
        .subscribe(),
    );
  }

  protected openPageRangeEditor(file: AssetFormFile) {
    if (isExistingAssetFile(file)) {
      const dialogRef = this.dialogService.open<
        PageRangeEditorComponent,
        PageRangeEditorData,
        PageRangeClassification[]
      >(PageRangeEditorComponent, {
        data: { classifications: file.pageRangeClassifications, pageCount: file.pageCount ?? 0 }, // todo: pageCount can be 0
        width: '925px',
        autoFocus: false,
      });

      this.subscriptions.add(
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.updatePageClassifications(file, result);
          }
        }),
      );
    }
  }

  protected openPdfPreview(file: AssetFormFile) {
    if (isExistingAssetFile(file)) {
      this.pdfOverlayService.openPdfOverlay({
        assetId: this.asset!.id,
        initialPdfId: file.id,
        assetPdfs: this.asset!.files.filter((f) => isExistingAssetFile(f) && f.name.endsWith('.pdf')).map((f) => ({
          id: f.id,
          fileName: f.name,
        })),
      });
    }
  }

  protected selectFile(control: FormControl<AssetFormFile>, event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedFiles.add(control.value);
    } else {
      this.selectedFiles.delete(control.value);
    }
  }

  protected setSearchTerm(term: string) {
    this.searchTerm$.next(term);
  }

  protected setFileType({ isLegal }: { isLegal: boolean }) {
    if (isLegal === this.isLegal$.value) {
      return;
    }
    this.selectedFiles.clear();
    this.isLegal$.next(isLegal);
  }

  protected updateLegalDocItemCode(control: FormControl<AssetFormFile>, [code]: LegalDocCode[]) {
    const file = { ...control.value, legalDocCode: code };
    control.setValue(file);
    if (this.selectedFiles.delete(control.value)) {
      this.selectedFiles.add(file);
    }
    this.form.markAsDirty();
  }

  protected toggleAll(event: MatCheckboxChange) {
    if (event.checked) {
      this.selectedFiles = new Set(this.form.value.filter((file) => this.isVisible(file)));
    } else {
      this.selectedFiles.clear();
    }
  }

  protected isSelected(file: AssetFormFile): boolean {
    return this.selectedFiles.has(file);
  }

  protected markFileForDeletion(file: AssetFormFile) {
    const fileIndex = this.form.value.findIndex((f) => f === file);
    if (fileIndex !== -1) {
      const updatedFile: AssetFormFile = { ...file, shouldBeDeleted: !file.shouldBeDeleted };
      this.form.at(fileIndex).patchValue(updatedFile);

      if (this.selectedFiles.delete(file)) {
        this.selectedFiles.add(updatedFile);
      }
      this.form.markAsDirty();
    }
  }

  protected downloadFile(file: AssetFormFile) {
    if (isExistingAssetFile(file)) {
      this.downloadFromPresignedUrl(file).subscribe();
    }
  }

  protected markSelectedFilesForDeletion() {
    this.transformSelectedFiles((file) => ({ ...file, shouldBeDeleted: true }));
  }

  protected downloadSelectedFiles() {
    const selectedFiles = this.dataSource.data
      .map((control) => control.value)
      .filter((file): file is ExistingAssetFile => isExistingAssetFile(file) && this.selectedFiles.has(file));

    // We add a delay to avoid having all anchors added at the same time, because clicks won't register properly
    from(selectedFiles)
      .pipe(concatMap((file) => this.downloadFromPresignedUrl(file).pipe(delay(300))))
      .subscribe();
  }

  protected sortChange(sort: Sort): void {
    const data = this.dataSource.data.slice();
    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    });
  }

  private updatePageClassifications(file: ExistingAssetFile, result: PageRangeClassification[]) {
    const index = this.form.value.findIndex((e) => e === file);
    if (index !== -1) {
      const entry = this.form.at(index);
      entry.patchValue({ ...file, pageRangeClassifications: result });
      entry.markAsDirty();
    }
  }

  private downloadFromPresignedUrl(file: ExistingAssetFile): Observable<AssetFileSignedUrl> {
    if (!this.asset) {
      throw new Error('Asset is not yet loaded.');
    }

    return this.httpClient
      .get<AssetFileSignedUrl>(`/api/assets/${this.asset.id}/files/${file.id}/presigned?download=true`)
      .pipe(
        tap(({ url }) => {
          triggerDownload(url, true);
        }),
      );
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

  private async fetchFileProcessingStates(): Promise<void> {
    if (this.asset === null) {
      return;
    }
    const newFileProcessingStates: FileProcessingStateMap = new Map();
    await firstValueFrom(
      this.httpClient.get<AssetFile[]>(`/api/assets/${this.asset.id}/files`).pipe(
        tap((assetFiles) => {
          for (const assetFile of assetFiles) {
            // if a file was successfully processed by the extraction stage, we need to update its classes
            if (
              this.fileProcessingStates().size > 0 &&
              assetFile.fileProcessingState === FileProcessingState.Success &&
              assetFile.fileProcessingStage === FileProcessingStage.Extraction &&
              this.fileProcessingStates().get(assetFile.id)?.fileProcessingState !== FileProcessingState.Success
            ) {
              const index = this.form.controls.findIndex((f) =>
                isExistingAssetFile(f.getRawValue())
                  ? (f.getRawValue() as ExistingAssetFile).id === assetFile.id
                  : false,
              );
              const entry = this.form.at(index);
              entry.patchValue({
                ...entry.value,
                pageCount: assetFile.pageCount,
                pageRangeClassifications: assetFile.pageRangeClassifications,
              });
            }

            newFileProcessingStates.set(assetFile.id, {
              fileProcessingStage: assetFile.fileProcessingStage,
              fileProcessingState: assetFile.fileProcessingState,
            });
          }
        }),
      ),
    );

    this.fileProcessingStates.set(newFileProcessingStates);
  }
}
