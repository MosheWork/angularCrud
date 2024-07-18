import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadGuideComponent } from './upload-guide.component';

describe('UploadGuideComponent', () => {
  let component: UploadGuideComponent;
  let fixture: ComponentFixture<UploadGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UploadGuideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
