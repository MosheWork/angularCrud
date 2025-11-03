import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IdEncryptComponent } from './id-encrypt.component';

describe('IdEncryptComponent', () => {
  let component: IdEncryptComponent;
  let fixture: ComponentFixture<IdEncryptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IdEncryptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IdEncryptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
