jest.mock('@asset-sg/client-shared', () => ({
  PdfViewerComponent: class MockPdfViewerComponent {},
  SelectComponent: class MockSelectComponent {},
}));

jest.mock('@swissgeol/ui-core-angular', () => ({
  SgcButton: class MockSgcButton {},
  SgcIcon: class MockSgcIcon {},
}));

import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PageCategory, PageRangeClassification } from '@asset-sg/shared/v2';
import { TranslateService } from '@ngx-translate/core';
import { PageRangeEditorComponent, PageRangeEditorData } from './page-range-editor.component';

describe('PageRangeEditorComponent', () => {
  let component: PageRangeEditorComponent;
  const dialogRefMock = {
    close: jest.fn(),
  };

  const initialClassifications: PageRangeClassification[] = [
    {
      from: 1,
      to: 2,
      categories: [PageCategory.Text],
      languages: ['de'],
      label: null,
    },
    {
      from: 3,
      to: 3,
      categories: [PageCategory.Boreprofile],
      languages: ['fr'],
      label: 'BH-1',
    },
  ];

  const dialogData: PageRangeEditorData = {
    classifications: initialClassifications,
    pageCount: 10,
    assetId: 1,
    assetFile: {
      id: 1,
      fileName: 'test.pdf',
      pageRangeClassifications: initialClassifications,
    },
  };

  beforeEach(() => {
    dialogRefMock.close.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefMock },
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
          },
        },
      ],
    });

    component = TestBed.runInInjectionContext(() => new PageRangeEditorComponent());
  });

  it('starts with no unsaved changes', () => {
    expect((component as any).hasUnsavedChanges()).toBe(false);
  });

  it('tracks add/remove of a classification as a reversible change', () => {
    (component as any).addClassification();
    expect((component as any).hasUnsavedChanges()).toBe(true);

    const lastIndex = (component as any).form.controls.classifications.length - 1;
    (component as any).removeClassification(lastIndex);

    expect((component as any).hasUnsavedChanges()).toBe(false);
  });

  it('clears unsaved state when changes are reverted to the original values', () => {
    const firstGroup = (component as any).form.controls.classifications.at(0);

    firstGroup.controls.label.setValue('  New custom label  ');
    expect((component as any).hasUnsavedChanges()).toBe(true);

    firstGroup.controls.label.setValue(null);
    expect((component as any).hasUnsavedChanges()).toBe(false);
  });

  it('normalizes labels on submit before closing the dialog', () => {
    const firstGroup = (component as any).form.controls.classifications.at(0);
    firstGroup.controls.label.setValue('  Introduction  ');

    (component as any).submit();

    expect(dialogRefMock.close).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          from: 1,
          to: 2,
          label: 'Introduction',
        }),
      ]),
    );
  });

  it('sorts groups by page range when updateOrder is called', () => {
    const groups = (component as any).form.controls.classifications;
    groups.clear();
    groups.push(
      (component as any).createFormGroup({
        from: 5,
        to: 5,
        categories: [PageCategory.Text],
        languages: ['de'],
        label: 'Z',
      }),
    );
    groups.push(
      (component as any).createFormGroup({
        from: 2,
        to: 3,
        categories: [PageCategory.Boreprofile],
        languages: ['fr'],
        label: 'A',
      }),
    );

    (component as any).updateOrder();

    const values = (component as any).form.getRawValue().classifications;
    expect(values.map((it: PageRangeClassification) => [it.from, it.to])).toEqual([
      [2, 3],
      [5, 5],
    ]);
  });

  it('keeps expanded state mapped to the same group after sorting', () => {
    const groups = (component as any).form.controls.classifications;
    groups.clear();
    groups.push(
      (component as any).createFormGroup({
        from: 5,
        to: 5,
        categories: [PageCategory.Text],
        languages: ['de'],
        label: 'First',
      }),
    );
    groups.push(
      (component as any).createFormGroup({
        from: 1,
        to: 1,
        categories: [PageCategory.Boreprofile],
        languages: ['fr'],
        label: 'Second',
      }),
    );
    (component as any).expandedClassificationIndices = new Set([0]);

    (component as any).updateOrder();

    const values = (component as any).form.getRawValue().classifications;
    expect(values[1].label).toBe('First');
    expect((component as any).isClassificationExpanded(1)).toBe(true);
    expect((component as any).isClassificationExpanded(0)).toBe(false);
  });
});
