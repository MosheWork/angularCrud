import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ERdashboardComponent } from './erdashboard.component';

describe('ERdashboardComponent', () => {
  let component: ERdashboardComponent;
  let fixture: ComponentFixture<ERdashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ERdashboardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ERdashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
