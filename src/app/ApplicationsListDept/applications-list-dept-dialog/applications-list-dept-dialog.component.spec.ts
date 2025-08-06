import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListDeptDialogComponent } from './applications-list-dept-dialog.component';

describe('ApplicationsListDeptDialogComponent', () => {
  let component: ApplicationsListDeptDialogComponent;
  let fixture: ComponentFixture<ApplicationsListDeptDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicationsListDeptDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationsListDeptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
