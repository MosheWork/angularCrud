import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatheterComponent } from './catheter.component';

describe('CatheterComponent', () => {
  let component: CatheterComponent;
  let fixture: ComponentFixture<CatheterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CatheterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CatheterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
