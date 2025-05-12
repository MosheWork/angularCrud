import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasurementDataMosheComponent } from './measurement-data-moshe.component';

describe('MeasurementDataMosheComponent', () => {
  let component: MeasurementDataMosheComponent;
  let fixture: ComponentFixture<MeasurementDataMosheComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MeasurementDataMosheComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasurementDataMosheComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
