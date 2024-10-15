import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Icd9ReportComponent } from './icd9-report.component';

describe('Icd9ReportComponent', () => {
  let component: Icd9ReportComponent;
  let fixture: ComponentFixture<Icd9ReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Icd9ReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Icd9ReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
