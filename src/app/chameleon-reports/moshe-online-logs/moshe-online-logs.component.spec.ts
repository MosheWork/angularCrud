import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MosheOnlineLogsComponent } from './moshe-online-logs.component';

describe('MosheOnlineLogsComponent', () => {
  let component: MosheOnlineLogsComponent;
  let fixture: ComponentFixture<MosheOnlineLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MosheOnlineLogsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MosheOnlineLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
