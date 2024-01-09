import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HospitalizationsListComponent } from './hospitalizations-list.component';

describe('HospitalizationsListComponent', () => {
  let component: HospitalizationsListComponent;
  let fixture: ComponentFixture<HospitalizationsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HospitalizationsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HospitalizationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
