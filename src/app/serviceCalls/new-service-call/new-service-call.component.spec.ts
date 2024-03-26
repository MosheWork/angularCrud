import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewServiceCallComponent } from './new-service-call.component';

describe('NewServiceCallComponent', () => {
  let component: NewServiceCallComponent;
  let fixture: ComponentFixture<NewServiceCallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewServiceCallComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewServiceCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
