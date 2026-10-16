import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ExportDialogComponent } from './export-dialog.component';

describe('ExportDialogComponent', () => {
  let fixture: ComponentFixture<ExportDialogComponent>;
  let dialogRefMock: { close: jest.Mock };

  const checkbox = (index: number): HTMLInputElement =>
    fixture.nativeElement.querySelectorAll('.export-dialog__option input[type="checkbox"]')[index];

  const files = () => checkbox(0);
  const csv = () => checkbox(1);
  const geoPackage = () => checkbox(2);

  const click = (input: HTMLInputElement) => {
    input.click();
    fixture.detectChanges();
  };

  const confirm = () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.export-dialog__actions button[asset-sg-primary]',
    );
    button.click();
  };

  beforeEach(async () => {
    dialogRefMock = { close: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ExportDialogComponent, TranslateModule.forRoot()],
      providers: [{ provide: MatDialogRef, useValue: dialogRefMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportDialogComponent);
    fixture.detectChanges();
  });

  it('selects CSV by default and enables GeoPackage', () => {
    expect(csv().checked).toBe(true);
    expect(geoPackage().checked).toBe(false);
    expect(geoPackage().disabled).toBe(false);
    expect(files().disabled).toBe(true);
  });

  it('deselects CSV when GeoPackage is selected, and vice versa', () => {
    click(geoPackage());
    expect(geoPackage().checked).toBe(true);
    expect(csv().checked).toBe(false);

    click(csv());
    expect(csv().checked).toBe(true);
    expect(geoPackage().checked).toBe(false);
  });

  it('returns the selected format on confirm', () => {
    click(geoPackage());
    confirm();
    expect(dialogRefMock.close).toHaveBeenCalledWith({ csv: false, geopackage: true });
  });

  it('returns CSV on confirm by default', () => {
    confirm();
    expect(dialogRefMock.close).toHaveBeenCalledWith({ csv: true, geopackage: false });
  });

  it('disables the export button when no format is selected', () => {
    click(csv());
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.export-dialog__actions button[asset-sg-primary]',
    );
    expect(button.disabled).toBe(true);
  });
});
