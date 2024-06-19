import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicTablesComponent } from './dynamic-tables.component';

describe('DynamicTablesComponent', () => {
  let component: DynamicTablesComponent;
  let fixture: ComponentFixture<DynamicTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DynamicTablesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
