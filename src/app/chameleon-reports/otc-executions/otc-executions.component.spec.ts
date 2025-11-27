import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtcExecutionsComponent } from './otc-executions.component';

describe('OtcExecutionsComponent', () => {
  let component: OtcExecutionsComponent;
  let fixture: ComponentFixture<OtcExecutionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OtcExecutionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OtcExecutionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
