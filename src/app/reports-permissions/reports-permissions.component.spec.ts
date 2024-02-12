import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportsPermissionsComponent } from './reports-permissions.component';

describe('ReportsPermissionsComponent', () => {
  let component: ReportsPermissionsComponent;
  let fixture: ComponentFixture<ReportsPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReportsPermissionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
