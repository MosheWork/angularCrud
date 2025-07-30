import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreastfeedingCoordinatorComponent } from './breastfeeding-coordinator.component';

describe('BreastfeedingCoordinatorComponent', () => {
  let component: BreastfeedingCoordinatorComponent;
  let fixture: ComponentFixture<BreastfeedingCoordinatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BreastfeedingCoordinatorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BreastfeedingCoordinatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
