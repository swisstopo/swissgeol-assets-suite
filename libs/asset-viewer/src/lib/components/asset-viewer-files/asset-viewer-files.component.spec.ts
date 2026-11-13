// The `@asset-sg/client-shared` barrel pulls in OpenLayers (ESM), which Jest can't load.
jest.mock('@asset-sg/client-shared', () =>
  jest
    .requireActual<
      typeof import('../../../testing/asset-search-test-helpers')
    >('../../../testing/asset-search-test-helpers')
    .createClientSharedMock({ LanguageService: class {}, PdfOverlayService: class {}, triggerDownload: jest.fn() }),
);

import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageService, PdfOverlayService } from '@asset-sg/client-shared';
import { AssetFile } from '@asset-sg/shared/v2';
import { TranslateModule } from '@ngx-translate/core';
import { provideRxRenderStrategies } from '@rx-angular/cdk/render-strategies';
import { RxFor } from '@rx-angular/template/for';
import { of } from 'rxjs';
import { StubReferencePipe } from '../../../testing/asset-search-test-helpers';
import { AssetViewerFilesTagComponent } from './asset-viewer-files-tag/asset-viewer-files-tag.component';
import { AssetViewerFilesComponent } from './asset-viewer-files.component';
import { FileSizePipe } from './file-size.pipe';

@Pipe({ name: 'fileName', standalone: true })
class StubFileNamePipe implements PipeTransform {
  transform(file: AssetFile): string {
    return file.alias ?? file.name;
  }
}

const file = (id: number, name: string, formatCode: string): AssetFile =>
  ({ id, name, alias: null, size: 2_500_000, legalDocCode: null, formatCode, pageCount: null }) as unknown as AssetFile;

describe(AssetViewerFilesComponent, () => {
  let fixture: ComponentFixture<AssetViewerFilesComponent>;

  const render = (files: AssetFile[], showFormat?: boolean) => {
    TestBed.configureTestingModule({
      declarations: [AssetViewerFilesComponent, AssetViewerFilesTagComponent, FileSizePipe],
      imports: [CommonModule, RxFor, TranslateModule.forRoot(), StubReferencePipe, StubFileNamePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        DecimalPipe,
        { provide: HttpClient, useValue: {} },
        { provide: LanguageService, useValue: { locale$: of('en-US') } },
        { provide: PdfOverlayService, useValue: {} },
        // `rxFor` renders through scheduled strategies by default; `native` renders within change detection.
        provideRxRenderStrategies({ primaryStrategy: 'native' }),
      ],
    });
    fixture = TestBed.createComponent(AssetViewerFilesComponent);
    fixture.componentRef.setInput('assetId', 1);
    fixture.componentRef.setInput('files', files);
    if (showFormat !== undefined) {
      fixture.componentRef.setInput('showFormat', showFormat);
    }
    fixture.detectChanges();
  };

  const tags = (fileId: number): string[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        `[data-testid="file-${fileId}"] .file__info__metadata asset-sg-asset-viewer-files-tag`,
      ),
    ).map((it) => it.getAttribute('data-testid') + ':' + (it.textContent ?? '').trim());

  afterEach(() => fixture.destroy());

  it('shows the format of each file as a tag before its size', () => {
    render([file(1, 'report.pdf', 'pdf'), file(2, 'well.las', 'las')], true);

    expect(tags(1)).toEqual(['file-format:PDF', 'file-size:2.4 MB']);
    expect(tags(2)).toEqual(['file-format:LAS', 'file-size:2.4 MB']);
  });

  it('shows the stored format, not one derived from the file name', () => {
    render([file(1, 'scan.pdf', 'segy')], true);

    expect(tags(1)).toEqual(['file-format:SEG', 'file-size:2.4 MB']);
  });

  it('shows no format tag by default', () => {
    render([file(1, 'report.pdf', 'pdf')]);

    expect(tags(1)).toEqual(['file-size:2.4 MB']);
  });
});
