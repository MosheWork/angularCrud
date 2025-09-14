import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PptDuplicateComponent } from './ppt-duplicate.component';

describe('PptDuplicateComponent', () => {
  let component: PptDuplicateComponent;
  let fixture: ComponentFixture<PptDuplicateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PptDuplicateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PptDuplicateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
