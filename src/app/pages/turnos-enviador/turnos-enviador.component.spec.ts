import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosEnviadorComponent } from './turnos-enviador.component';

describe('TurnosEnviadorComponent', () => {
  let component: TurnosEnviadorComponent;
  let fixture: ComponentFixture<TurnosEnviadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TurnosEnviadorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnosEnviadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
