import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasurementDefComponent } from './measurement-def.component';

describe('MeasurementDefComponent', () => {
  let component: MeasurementDefComponent;
  let fixture: ComponentFixture<MeasurementDefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeasurementDefComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasurementDefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
