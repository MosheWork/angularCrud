import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CameleonNoCaseNumberReasonsComponent } from './cameleon-no-case-number-reasons.component';

describe('CameleonNoCaseNumberReasonsComponent', () => {
  let component: CameleonNoCaseNumberReasonsComponent;
  let fixture: ComponentFixture<CameleonNoCaseNumberReasonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CameleonNoCaseNumberReasonsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CameleonNoCaseNumberReasonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
