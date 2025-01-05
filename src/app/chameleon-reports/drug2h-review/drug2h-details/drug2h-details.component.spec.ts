import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Drug2hDetailsComponent } from './drug2h-details.component';

describe('Drug2hDetailsComponent', () => {
  let component: Drug2hDetailsComponent;
  let fixture: ComponentFixture<Drug2hDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Drug2hDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Drug2hDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
