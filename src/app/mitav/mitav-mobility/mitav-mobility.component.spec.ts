import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavMobilityComponent } from './mitav-mobility.component';

describe('MitavMobilityComponent', () => {
  let component: MitavMobilityComponent;
  let fixture: ComponentFixture<MitavMobilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavMobilityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavMobilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
