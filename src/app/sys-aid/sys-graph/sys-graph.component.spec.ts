import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SysGraphComponent } from './sys-graph.component';

describe('SysGraphComponent', () => {
  let component: SysGraphComponent;
  let fixture: ComponentFixture<SysGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SysGraphComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SysGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
