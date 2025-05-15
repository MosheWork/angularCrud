import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasurementTargetManagerComponent } from './measurement-target-manager.component';

describe('MeasurementTargetManagerComponent', () => {
  let component: MeasurementTargetManagerComponent;
  let fixture: ComponentFixture<MeasurementTargetManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeasurementTargetManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasurementTargetManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
