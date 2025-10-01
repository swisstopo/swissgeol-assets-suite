import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdftestComponent } from './pdftest.component';

describe('PdftestComponent', () => {
  let component: PdftestComponent;
  let fixture: ComponentFixture<PdftestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdftestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PdftestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
