import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditApplicationDialogComponent } from './add-edit-application-dialog.component';

describe('AddEditApplicationDialogComponent', () => {
  let component: AddEditApplicationDialogComponent;
  let fixture: ComponentFixture<AddEditApplicationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditApplicationDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditApplicationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
