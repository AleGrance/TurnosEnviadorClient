import { TestBed } from '@angular/core/testing';

import { ApienviadorService } from './apienviador.service';

describe('ApienviadorService', () => {
  let service: ApienviadorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApienviadorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
