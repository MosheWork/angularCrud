import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SysAidComponent } from './sys-aid.component';

describe('SysAidComponent', () => {
  let component: SysAidComponent;
  let fixture: ComponentFixture<SysAidComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SysAidComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SysAidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
