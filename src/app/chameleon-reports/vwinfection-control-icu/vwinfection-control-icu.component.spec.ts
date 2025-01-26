import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VWInfectionControlICUComponent } from './vwinfection-control-icu.component';

describe('VWInfectionControlICUComponent', () => {
  let component: VWInfectionControlICUComponent;
  let fixture: ComponentFixture<VWInfectionControlICUComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VWInfectionControlICUComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VWInfectionControlICUComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
