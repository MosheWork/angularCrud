import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrugsReportComponentComponent } from './drugs-report-component.component';

describe('DrugsReportComponentComponent', () => {
  let component: DrugsReportComponentComponent;
  let fixture: ComponentFixture<DrugsReportComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrugsReportComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrugsReportComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
