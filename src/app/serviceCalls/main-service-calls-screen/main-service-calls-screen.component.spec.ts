import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainServiceCallsScreenComponent } from './main-service-calls-screen.component';

describe('MainServiceCallsScreenComponent', () => {
  let component: MainServiceCallsScreenComponent;
  let fixture: ComponentFixture<MainServiceCallsScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainServiceCallsScreenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainServiceCallsScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
