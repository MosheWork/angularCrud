import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitavSummaryDeliriumComponent } from './mitav-summary-delirium.component';

describe('MitavSummaryDeliriumComponent', () => {
  let component: MitavSummaryDeliriumComponent;
  let fixture: ComponentFixture<MitavSummaryDeliriumComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MitavSummaryDeliriumComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MitavSummaryDeliriumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
