import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevicesPerUnitComponent } from './devices-per-unit.component';

describe('DevicesPerUnitComponent', () => {
  let component: DevicesPerUnitComponent;
  let fixture: ComponentFixture<DevicesPerUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DevicesPerUnitComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevicesPerUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
