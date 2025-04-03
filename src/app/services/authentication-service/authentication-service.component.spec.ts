import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthenticationServiceComponent } from './authentication-service.component';

describe('AuthenticationServiceComponent', () => {
  let component: AuthenticationServiceComponent;
  let fixture: ComponentFixture<AuthenticationServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuthenticationServiceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthenticationServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
