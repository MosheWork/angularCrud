import { TestBed } from '@angular/core/testing';

import { IbService } from './ib.service';

describe('IbService', () => {
  let service: IbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
