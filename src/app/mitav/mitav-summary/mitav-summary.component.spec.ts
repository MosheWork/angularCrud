import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavSummaryComponent } from './mitav-summary.component';

describe('MitavSummaryComponent', () => {
  let component: MitavSummaryComponent;
  let fixture: ComponentFixture<MitavSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavSummaryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
