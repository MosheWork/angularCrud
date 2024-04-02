import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowEditDialogComponent } from './row-edit-dialog.component';

describe('RowEditDialogComponent', () => {
  let component: RowEditDialogComponent;
  let fixture: ComponentFixture<RowEditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RowEditDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RowEditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
