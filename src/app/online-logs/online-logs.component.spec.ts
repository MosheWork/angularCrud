import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineLogsComponent } from './online-logs.component';

describe('OnlineLogsComponent', () => {
  let component: OnlineLogsComponent;
  let fixture: ComponentFixture<OnlineLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OnlineLogsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OnlineLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
