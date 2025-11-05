import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChameleonUserProfileUnitMapComponent } from './chameleon-user-profile-unit-map.component';

describe('ChameleonUserProfileUnitMapComponent', () => {
  let component: ChameleonUserProfileUnitMapComponent;
  let fixture: ComponentFixture<ChameleonUserProfileUnitMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChameleonUserProfileUnitMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChameleonUserProfileUnitMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
