import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SQLComponent } from './sql.component';

describe('SQLComponent', () => {
  let component: SQLComponent;
  let fixture: ComponentFixture<SQLComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SQLComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SQLComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
