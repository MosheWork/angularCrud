import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditServerDialogComponent } from './add-edit-server-dialog.component';

describe('AddEditServerDialogComponent', () => {
  let component: AddEditServerDialogComponent;
  let fixture: ComponentFixture<AddEditServerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditServerDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditServerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
