import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EpidemiologicalInvestigationComponent } from './epidemiological-investigation.component';

describe('EpidemiologicalInvestigationComponent', () => {
  let component: EpidemiologicalInvestigationComponent;
  let fixture: ComponentFixture<EpidemiologicalInvestigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EpidemiologicalInvestigationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EpidemiologicalInvestigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
