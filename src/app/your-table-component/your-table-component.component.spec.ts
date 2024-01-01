import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YourTableComponentComponent } from './your-table-component.component';

describe('YourTableComponentComponent', () => {
  let component: YourTableComponentComponent;
  let fixture: ComponentFixture<YourTableComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YourTableComponentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YourTableComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
