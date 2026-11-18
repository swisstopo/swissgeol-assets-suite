// The `@asset-sg/client-shared` barrel pulls in OpenLayers (ESM), which Jest can't load.
jest.mock('@asset-sg/client-shared', () => {
  const state = (key: string) => (s: Record<string, unknown>) => s[key];
  return {
    fromAppShared: {
      selectReferenceLegalDocCodes: state('legalDocCodes'),
      selectReferenceAssetFormats: state('formats'),
    },
    ConfirmDialogComponent: class {},
    PdfOverlayService: class {},
    triggerDownload: jest.fn(),
  };
});
jest.mock('./page-range-editor/page-range-editor.component', () => ({ PageRangeEditorComponent: class {} }));

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormControl } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PdfOverlayService } from '@asset-sg/client-shared';
import {
  Asset,
  CreateAssetFileData,
  fixtures,
  LegalDocCode,
  LocalizedItem,
  LocalizedItemCode,
} from '@asset-sg/shared/v2';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RxPush } from '@rx-angular/template/push';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { SelectComponent } from '../../../../../../client-shared/src/lib/components/select/select.component';
import { AssetEditorService } from '../../../services/asset-editor.service';
import { AssetFormFile } from '../../asset-editor-page/asset-editor-page.component';
import { AssetEditorFilesComponent } from './asset-editor-files.component';
import { FileDropZoneComponent } from './file-drop-zone/file-drop-zone.component';
import { HasCompletedExtractionPipe } from './has-completed-extraction.pipe';

const item = (code: string): LocalizedItem =>
  ({ code, name: `name-${code}`, description: code, geolCode: '' }) as unknown as LocalizedItem;

const FORMATS = ['pdf', 'graphicRaster', 'other'].map(item);
const toMap = (items: LocalizedItem[]) => new Map(items.map((it) => [it.code, it]));

const baseFile = fixtures.assets.minimal.files[0];
const normalFile: AssetFormFile = { ...baseFile, id: 1, name: 'report.pdf', formatCode: 'pdf', shouldBeDeleted: false };
const legalFile: AssetFormFile = {
  ...baseFile,
  id: 2,
  name: 'contract.pdf',
  formatCode: 'pdf',
  legalDocCode: LegalDocCode.Contract,
  shouldBeDeleted: false,
};

describe('file formats in the files tab', () => {
  let fixture: ComponentFixture<AssetEditorFilesComponent>;
  let form: FormArray<FormControl<AssetFormFile>>;

  const formatSelects = () =>
    fixture.debugElement
      .queryAll(By.css('[data-testid="file-format-select"] asset-sg-select'))
      .map((it) => it.componentInstance as SelectComponent<LocalizedItem, LocalizedItemCode>);

  const showLegalTab = () => {
    fixture.componentInstance['setFileType']({ isLegal: true });
    fixture.detectChanges();
  };

  beforeEach(async () => {
    form = new FormArray<FormControl<AssetFormFile>>([
      new FormControl(normalFile, { nonNullable: true }),
      new FormControl(legalFile, { nonNullable: true }),
    ]);
    await TestBed.configureTestingModule({
      declarations: [AssetEditorFilesComponent],
      imports: [
        MatTableModule,
        MatSortModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        RxPush,
        SelectComponent,
        HasCompletedExtractionPipe,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideMockStore({ initialState: { formats: toMap(FORMATS), legalDocCodes: toMap([]) } }),
        { provide: MatDialog, useValue: {} },
        { provide: PdfOverlayService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetEditorFilesComponent);
    fixture.componentInstance.form = form;
    fixture.componentInstance.asset = null;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('shows a format dropdown for normal files only', () => {
    expect(fixture.componentInstance.displayedColumns).toContain('formatCode');
    expect(fixture.componentInstance.displayedColumns).not.toContain('legalDocCode');
    expect(formatSelects()).toHaveLength(1);

    showLegalTab();

    expect(fixture.componentInstance.displayedColumns).not.toContain('formatCode');
    expect(fixture.componentInstance.displayedColumns).toContain('legalDocCode');
    expect(formatSelects()).toHaveLength(0);
  });

  it('preselects the stored format of the file', () => {
    const [select] = formatSelects();
    expect(select.values.map((it) => it.code)).toEqual(['pdf', 'graphicRaster', 'other']);
    expect((select.selectedValues as LocalizedItem).code).toBe('pdf');
  });

  it('stores a changed format on the file and marks the form as changed', () => {
    const [select] = formatSelects();
    select.onFilterChange(FORMATS[2]);

    expect(form.at(0).value.formatCode).toBe('other');
    expect(form.at(1).value.formatCode).toBe('pdf');
    expect(form.dirty).toBe(true);
  });

  it('keeps a checked file selected for bulk actions after its format changes', () => {
    const component = fixture.componentInstance;
    component['selectFile'](form.at(0), { checked: true } as MatCheckboxChange);

    const [select] = formatSelects();
    select.onFilterChange(FORMATS[2]);

    expect(component['isSelected'](form.at(0).value)).toBe(true);
    component['markSelectedFilesForDeletion']();
    expect(form.at(0).value).toEqual(expect.objectContaining({ formatCode: 'other', shouldBeDeleted: true }));
    expect(form.at(1).value.shouldBeDeleted).toBe(false);
  });

  it('keeps the form unchanged when the same format is selected again', () => {
    const [select] = formatSelects();
    select.onFilterChange(FORMATS[0]);

    expect(form.at(0).value).toBe(normalFile);
    expect(form.dirty).toBe(false);
  });
});

describe('format preselection of dropped files', () => {
  const drop = (isLegal: boolean, ...names: string[]) => {
    const component = new FileDropZoneComponent();
    component.form = new FormArray<FormControl<AssetFormFile>>([]);
    component.isLegal = isLegal;
    const files = names.map((name) => new File(['x'], name));
    component.onFileSelected({ target: { files } } as unknown as Event);
    return component.form.value;
  };

  it('assigns the extension-based format to each pending file', () => {
    const files = drop(false, 'Report.PDF', 'scan.tiff', 'notes', 'archive.zip', 'metadata.xml');

    expect(files.map((it) => it.formatCode)).toEqual(['pdf', 'graphicRaster', 'other', 'archive', 'other']);
  });

  it('assigns the extension-based format to pending legal documents', () => {
    const [file] = drop(true, 'contract.pdf');

    expect(file.legalDocCode).toBe(LegalDocCode.FederalData);
    expect(file.formatCode).toBe('pdf');
  });
});

describe('uploading files with their format', () => {
  let service: AssetEditorService;
  let http: HttpTestingController;
  const asset: Asset = fixtures.assets.minimal;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AssetEditorService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const upload = (file: CreateAssetFileData): FormData => {
    service.uploadFilesForAsset(asset.id, [file]).subscribe();
    return http.expectOne(`/api/assets/${asset.id}/files`).request.body as FormData;
  };

  it('sends a format that differs from the detected one as an override', () => {
    const body = upload({ file: new File(['x'], 'scan.pdf'), legalDocCode: null, formatCode: 'other' });

    expect(body.get('formatCode')).toBe('other');
    expect(body.has('legalDocCode')).toBe(false);
  });

  it('omits an untouched detected format so that the server detects it', () => {
    const body = upload({ file: new File(['x'], 'Scan.PDF'), legalDocCode: null, formatCode: 'pdf' });

    expect(body.has('formatCode')).toBe(false);
    expect(body.get('file')).toBeInstanceOf(File);
  });

  it('omits the detected format of a legal document', () => {
    const body = upload({
      file: new File(['x'], 'contract.pdf'),
      legalDocCode: LegalDocCode.Contract,
      formatCode: 'pdf',
    });

    expect(body.has('formatCode')).toBe(false);
    expect(body.get('legalDocCode')).toBe(LegalDocCode.Contract);
  });
});
