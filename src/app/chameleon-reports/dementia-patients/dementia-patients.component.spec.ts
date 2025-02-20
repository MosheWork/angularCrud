import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DementiaPatientsComponent } from './dementia-patients.component';

describe('DementiaPatientsComponent', () => {
  let component: DementiaPatientsComponent;
  let fixture: ComponentFixture<DementiaPatientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DementiaPatientsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DementiaPatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
