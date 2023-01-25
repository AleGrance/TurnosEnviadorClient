import { TestBed } from '@angular/core/testing';

import { MetrepayServiceService } from './metrepay-service.service';

describe('MetrepayServiceService', () => {
  let service: MetrepayServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetrepayServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
