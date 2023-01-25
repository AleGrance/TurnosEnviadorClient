import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetrepaytestComponent } from './metrepaytest.component';

describe('MetrepaytestComponent', () => {
  let component: MetrepaytestComponent;
  let fixture: ComponentFixture<MetrepaytestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MetrepaytestComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetrepaytestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
