import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTaskDialogComponentComponent } from './add-task-dialog-component.component';

describe('AddTaskDialogComponentComponent', () => {
  let component: AddTaskDialogComponentComponent;
  let fixture: ComponentFixture<AddTaskDialogComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTaskDialogComponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTaskDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
