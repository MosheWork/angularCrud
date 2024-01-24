import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPageReportsComponent } from './main-page-reports.component';

describe('MainPageReportsComponent', () => {
  let component: MainPageReportsComponent;
  let fixture: ComponentFixture<MainPageReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MainPageReportsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MainPageReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
