import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SysAidGraphComponent } from './sys-aid-graph.component';

describe('SysAidGraphComponent', () => {
  let component: SysAidGraphComponent;
  let fixture: ComponentFixture<SysAidGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SysAidGraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SysAidGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
