import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationsListDeptComponent } from './applications-list-dept.component';

describe('ApplicationsListDeptComponent', () => {
  let component: ApplicationsListDeptComponent;
  let fixture: ComponentFixture<ApplicationsListDeptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApplicationsListDeptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationsListDeptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
