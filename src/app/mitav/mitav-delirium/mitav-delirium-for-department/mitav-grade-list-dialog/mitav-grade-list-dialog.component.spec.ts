import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavGradeListDialogComponent } from './mitav-grade-list-dialog.component';

describe('MitavGradeListDialogComponent', () => {
  let component: MitavGradeListDialogComponent;
  let fixture: ComponentFixture<MitavGradeListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavGradeListDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavGradeListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
