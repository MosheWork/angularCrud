import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalAppPermissionComponent } from './global-app-permission.component';

describe('GlobalAppPermissionComponent', () => {
  let component: GlobalAppPermissionComponent;
  let fixture: ComponentFixture<GlobalAppPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GlobalAppPermissionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalAppPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
