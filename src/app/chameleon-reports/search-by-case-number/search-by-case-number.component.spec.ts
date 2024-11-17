import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchByCaseNumberComponent } from './search-by-case-number.component';

describe('SearchByCaseNumberComponent', () => {
  let component: SearchByCaseNumberComponent;
  let fixture: ComponentFixture<SearchByCaseNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SearchByCaseNumberComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchByCaseNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
