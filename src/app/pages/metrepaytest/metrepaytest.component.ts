import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { MetrepayServiceService } from 'src/app/services/metrepay-service.service';

@Component({
  selector: 'app-metrepaytest',
  templateUrl: './metrepaytest.component.html',
  styleUrls: ['./metrepaytest.component.css'],
})
export class MetrepaytestComponent implements OnInit {
  constructor(private apiMetrepay: MetrepayServiceService) {}

  ngOnInit(): void {

  }

  // POST
  solicitarUrl() {
    let datosPago = {
      label: 'Cuota social del mes de Febrero',
      amount: 25000,
      handleValue: 'adriana@odontos.com.py',
      handleLabel: 'Adriana Gimenez',
      customIdentifier: '5668899',
      singlePayment: true,
      creditAndDebitCard: true,
      redirectUrl: '',
    };

    // Crear link de pago unico
    this.apiMetrepay
      .post('saleitems/add', datosPago)
      .pipe(
        map((data: any) => {
          let objetoRetorno;
          objetoRetorno = data;
          console.log('Este es el objeto retorno POST: ', objetoRetorno);
        })
      )
      .subscribe({
        // next(result: any) {
        //   console.log('Resultado: ', result);
        // },
        error(msg) {
          console.log('Error en la consulta POST: ', msg.message);
        },
      });
  }

  // GET
  solicitarUrlGenerado() {
    let id = 1615;
    let datosObtenidos: any;
    this.apiMetrepay
      .get('payrequests/' + id)
      .pipe(
        map((data) => {
          datosObtenidos = data;

          console.log(datosObtenidos);
        })
      )
      .subscribe({
        // next(result) {
        //   console.log('Resultado del post: ', result);
        // },
        error(msg) {
          console.log('Error en la petición GET: ', msg.message);
        },
      });
  }
}
