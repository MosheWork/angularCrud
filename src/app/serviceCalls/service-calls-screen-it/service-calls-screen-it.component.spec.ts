import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCallsScreenITComponent } from './service-calls-screen-it.component';

describe('ServiceCallsScreenITComponent', () => {
  let component: ServiceCallsScreenITComponent;
  let fixture: ComponentFixture<ServiceCallsScreenITComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ServiceCallsScreenITComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceCallsScreenITComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
