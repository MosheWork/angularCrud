import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunicationTherapistComponent } from './communication-therapist.component';

describe('CommunicationTherapistComponent', () => {
  let component: CommunicationTherapistComponent;
  let fixture: ComponentFixture<CommunicationTherapistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunicationTherapistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunicationTherapistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
