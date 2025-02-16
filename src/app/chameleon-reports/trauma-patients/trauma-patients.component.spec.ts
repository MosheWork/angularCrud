import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraumaPatientsComponent } from './trauma-patients.component';

describe('TraumaPatientsComponent', () => {
  let component: TraumaPatientsComponent;
  let fixture: ComponentFixture<TraumaPatientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TraumaPatientsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TraumaPatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
