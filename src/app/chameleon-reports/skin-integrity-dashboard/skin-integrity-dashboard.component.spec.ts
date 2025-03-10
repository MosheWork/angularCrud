import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkinIntegrityDashboardComponent } from './skin-integrity-dashboard.component';

describe('SkinIntegrityDashboardComponent', () => {
  let component: SkinIntegrityDashboardComponent;
  let fixture: ComponentFixture<SkinIntegrityDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SkinIntegrityDashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkinIntegrityDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
