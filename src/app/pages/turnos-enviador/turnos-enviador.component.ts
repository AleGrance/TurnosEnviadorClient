import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { DatePipe } from '@angular/common';
import { map } from 'rxjs/operators';
// img
import * as htmlToImage from 'html-to-image';
import { toPng, toJpeg, toBlob, toPixelData, toSvg } from 'html-to-image';
import { Observable } from 'rxjs';
import { ApienviadorService } from 'src/app/services/apienviador.service';
import { Toast, ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-turnos-enviador',
  templateUrl: './turnos-enviador.component.html',
  styleUrls: ['./turnos-enviador.component.css'],
})
export class TurnosEnviadorComponent implements OnInit {
  constructor(
    private api: ApiService,
    private apiEnviador: ApienviadorService,
    private toastr: ToastrService
  ) {}

  turnos: any = [];
  idTurno = 0;
  cards: any;

  // Datos del Mensaje de whatsapp
  fileMimeTypeMedia = '';
  fileBase64Media = '';

  // Formatear fecha
  pipe = new DatePipe('en-US');

  // Tiempo de retraso entre envios
  tiempoRetraso = 5000;

  ngOnInit(): void {
    this.getTurnosPendientes();

    setInterval((): void => {
      //this.getTurnosPendientes();
    }, 1000 * 60);
  }

  // Get turnos - TurnosEnviador
  // Solamente los que estan pendiente de envío - API de Turnos
  getTurnosPendientes() {
    this.api
      .get('turnosPendientes')
      .pipe(
        map((data) => {
          this.turnos = data;
          //this.iniciarEnvio();
          if (this.turnos.length === 0) {
            console.log('Sin agendamientos pendientes de envio!');
          }
          console.log(this.turnos);
        })
      )
      .subscribe({
        // next(result) {
        //   console.log('Resultado del post: ', result);
        // },
        error(msg) {
          alert('Error al traer los turnos PostgreSQL: ' + msg.message);
          console.log('Error en la petición GET: ', msg.message);
        },
      });
  }

  // Funcion de retraso para el for()
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async iniciarEnvio() {
    if (this.turnos.length === 0) {
      console.log('Sin agendamientos pendientes de envio!');
      this.toastr.warning('Sin turnos por el momento!', 'Alerta!');
    }

    //this.showSpinner();

    for (let t of this.turnos) {
      let fecha_turno = this.pipe.transform(t.fecha_turno, 'dd/MM/yyyy');
      let hora_turno = t.hora_turno;
      let comentario = t.comentario;
      let profesional = t.profesional;
      let sucursal = t.sucursal;
      let cliente = t.cliente;
      let contacto = t.contacto_cliente;
      let id = t.id_turno;

      let objetoTurno = {
        id: id,
        fecha: fecha_turno,
        hora: hora_turno,
        comentario: comentario,
        pro: profesional,
        suc: sucursal,
        cli: cliente,
        contacto: contacto,
      };

      // Se escribe en la tabla de los logs de los envios realizados
      let outputTable = (<HTMLInputElement>(
        document.getElementById('outputTable')
      )).innerHTML;

      (<HTMLInputElement>document.getElementById('outputTable')).innerHTML =
        `<tr>
        <th scope="row">` +
        objetoTurno.id +
        `</th>
        <td>` +
        objetoTurno.fecha +
        `</td>
        <td>` +
        objetoTurno.hora +
        `</td>
        <td>` +
        objetoTurno.comentario +
        `</td>
        <td>` +
        objetoTurno.pro +
        `</td>
        <td>` +
        objetoTurno.suc +
        `</td>
        <td>` +
        objetoTurno.cli +
        `</td>
        <td>` +
        objetoTurno.contacto +
        `</td>
        </tr>
        ` +
        outputTable;

      // Se crea la variable del ID del turno. para modificar su estado una vez que se envie el mensaje
      let idTurno = t.id_turno;

      // Aca se forma la tarjeta con los datos del turno
      this.cards =
        `
        <img class="card-img-top" src="../../../assets/img/odontos.svg" alt="Card image cap" id="imagen">
        <div class="card-body" id="card-body" style="background-color: white;">
          <h5 class="card-title">` +
        cliente +
        `</h5>
              <h5 class="card-title">Fecha del turno: ` +
        fecha_turno +
        `</h5>
              <h5 class="card-title">Hora del turno: ` +
        hora_turno +
        `</h5>
              <h6 class="card-subtitle mb-2 text-muted">Sucursal: ` +
        sucursal +
        `</h6>
              <h6 class="card-subtitle mb-2 text-muted">Profesional: ` +
        profesional +
        `</h6>
              <p class="card-text">` +
        comentario +
        `</p>
        </div>
        `;

      // Aca se escribe en el DOM
      (<HTMLInputElement>document.getElementById('card')).innerHTML =
        this.cards;

      // Se retrasa la llamada a la función debido a que el DOM no renderiza de inmediato el logo de odontos
      setTimeout(() => {
        this.crearImg(contacto, idTurno, cliente);
      }, 1000)

      //console.log('Crear imagen!', cliente, contacto, idTurno);

      // Se llama a la funcion de retraso para ejecutar todo cada 5 segundos
      await this.sleep(this.tiempoRetraso);
    }
    this.turnos = [];
    //this.hideSpinner();
    //this.showAviso();
  }

  // Se crea la IMAGEN de la tarjeta creada
  crearImg(contacto: any, idTurno: any, cliente: any) {
    let node = <HTMLInputElement>document.getElementById('card');

    htmlToImage
      .toJpeg(node)
      .then((dataUrl) => {
        var img = new Image();
        img.src = dataUrl;

        this.fileMimeTypeMedia = img.src.split(';base64,')[0];
        this.fileMimeTypeMedia = this.fileMimeTypeMedia.slice(5);
        this.fileBase64Media = img.src.split(',')[1];

        this.cargarObj(
          contacto,
          idTurno,
          cliente,
          this.fileBase64Media,
          this.fileMimeTypeMedia
        );
      })
      .catch(function (error) {
        console.error('Error al crear la imagen!', error);
      });

    // Descargar imagen en JPEG
    // let image = <HTMLInputElement>document.getElementById('card');

    // htmlToImage
    //   .toJpeg(image, {
    //     quality: 0.95,
    //   })
    //   .then(function (dataUrl) {
    //     var link = document.createElement('a');
    //     link.download = cliente + '.jpeg';
    //     link.href = dataUrl;
    //     link.click();
    //   });
  }

  // Se crea el objeto del mensaje con la imagen creada a enviar por la API
  cargarObj(
    contacto: any,
    idTurno: any,
    cliente: any,
    base64: any,
    mimeType: any
  ) {
    let objWa = {
      message: 'Usted ha sido agendado!',
      phone: contacto,
      mimeType: mimeType,
      data: base64,
      fileName: '',
      fileSize: 0,
    };
    //console.log("Lo que se envia: ", objWa);
    this.enviarMensaje(objWa, idTurno, cliente);
  }

  // Se envia el mensaje atravez del EnviadorMasivo
  enviarMensaje(objWa: any, idTurno: any, cliente: any) {
    //let turnoId = this.idTurno;
    this.apiEnviador
      .post('lead', objWa)
      .pipe(
        map((data: any) => {
          let objetoRetorno;
          objetoRetorno = data;
          console.log('Este es el objeto retorno POST: ', objetoRetorno);

          if (data.responseExSave.error) {
            console.log('Error en este nro: ', objWa.phone);
            // Se puede auto enviar un mensaje indicando que no se envió por X problema
            //this.notificarError(objWa.phone, idTurno, cliente);
          }

          if (data.responseExSave.id) {
            console.log('El id es: ', idTurno);
            this.updateEstatus(idTurno);
          }
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

  // Una vez que el envio haya sido exitoso. Se actualiza el estado del turno en la DB PostgreSQL
  updateEstatus(idTurno: any) {
    // Se crea el objeto turno con el campo estado_envio modificado
    let objTurno = {
      estado_envio: 1,
    };

    this.api.put('turnos/' + idTurno, objTurno).subscribe({
      next(result: any) {
        console.log('Resultado del PUT: ', result);
      },
      error(msg) {
        console.log('Error en la consulta PUT: ', msg.message);
      },
    });
  }

  // En caso de tener error en el envio de agendamiento de turno al cliente, se le notifica al numero vinculado con los datos del cliente
  notificarError(contacto: any, idTurno: any, cliente: any) {
    let objWa = {
      message:
        'No se pudo enviar la notificación de agendamiento del turno al cliente: ' +
        cliente +
        ' con el número: ' +
        contacto +
        ' ID de turno: ' +
        idTurno,
      phone: '595986153301',
      mimeType: '',
      data: '',
      fileName: '',
      fileSize: 0,
    };

    this.apiEnviador.post('lead', objWa).subscribe({
      next(result: any) {
        console.log('Resultado de la notificación: ', result);
      },
      error(msg) {
        console.log('Error en la petición POST: ', msg.message);
      },
    });
  }

  showSpinner() {
    (<HTMLInputElement>document.getElementById('spinner')).style.display =
      'block';
  }

  hideSpinner() {
    (<HTMLInputElement>document.getElementById('spinner')).style.display =
      'none';
  }

  showAviso() {
    (<HTMLInputElement>document.getElementById('aviso')).style.display =
      'block';
  }

  // Con observables y manejadores de errores
  // posteo2(objWa: any) {
  //   // Create an Observable that will start listening to geolocation updates
  //   // when a consumer subscribes.
  //   const locations = new Observable((observer) => {
  //     let watchId: number;

  //     // Simple geolocation API check provides values to publish
  //     if ('geolocation' in navigator) {
  //       watchId = navigator.geolocation.watchPosition(
  //         (position: GeolocationPosition) => {
  //           observer.next(position);
  //         },
  //         (error: GeolocationPositionError) => {
  //           observer.error(error);
  //         }
  //       );
  //     } else {
  //       observer.error('Geolocation not available');
  //     }

  //     // When the consumer unsubscribes, clean up data ready for next subscription.
  //     return {
  //       unsubscribe() {
  //         navigator.geolocation.clearWatch(watchId);
  //       },
  //     };
  //   });

  //   // Call subscribe() to start listening for updates.
  //   const locationsSubscription = locations.subscribe({
  //     next(position) {
  //       console.log('Current Position: ', position);
  //     },
  //     error(msg) {
  //       console.log('Error Getting Location: ', msg);
  //     },
  //   });

  //   // Stop listening for location after 10 seconds
  //   setTimeout(() => {
  //     locationsSubscription.unsubscribe();
  //   }, 10000);

  //   // this.api.post('lead', objWa).subscribe(
  //   //   (result: any) => {console.log(result)}
  //   //   );

  //   // METODO DEPRECADO

  //   // this.api.post('lead', objeto).subscribe(
  //   //   (result: any) => {
  //   //     // Checks if there is an error in the response before continue
  //   //     if (result.responseExSave.error) {
  //   //       const errMsg = result.responseExSave.error.slice(0, 17);
  //   //       //console.log(errMsg);

  //   //       // if (errMsg === 'Escanee el código') {
  //   //       //   this.toastr.error(
  //   //       //     result.responseExSave.error +
  //   //       //       " <a href='./assets/img/qr.svg' target='_blank'>Aqui</a>",
  //   //       //     'Error',
  //   //       //     {
  //   //       //       timeOut: 0,
  //   //       //       enableHtml: true,
  //   //       //     }
  //   //       //   );
  //   //       //   this.resetFormulario();
  //   //       //   return;
  //   //       // }

  //   //       // if (errMsg === 'Protocol error (R') {
  //   //       //   this.toastr.error(
  //   //       //     'Se ha cerrado la sesión, inicie nuevamente escaneando el código ' +
  //   //       //       " <a href='./assets/img/qr.svg' target='_blank'>Aqui</a>" +
  //   //       //       '. Antes de escanear el código reinicie la aplicación y actualice con F5 la pestaña de la imagen QR.',
  //   //       //     'Error',
  //   //       //     {
  //   //       //       timeOut: 0,
  //   //       //       enableHtml: true,
  //   //       //     }
  //   //       //   );
  //   //       //   this.resetFormulario();
  //   //       //   return;
  //   //       // }

  //   //       // if (errMsg === 'Evaluation failed') {
  //   //       //   window.alert(
  //   //       //     'Verificar el numero: ' +
  //   //       //       this.numeroCliente +
  //   //       //       ' se ha detenido el envío en este registro'
  //   //       //   );

  //   //       //   this.toastr.error(result.responseExSave.error, 'Error', {
  //   //       //     timeOut: 0,
  //   //       //   });
  //   //       //   this.resetFormulario();
  //   //       //   return;
  //   //       // }

  //   //       // this.toastr.error(result.responseExSave.error, 'Error', {
  //   //       //   timeOut: 0,
  //   //       // });
  //   //       // this.resetFormulario();
  //   //       return;
  //   //     }

  //   //     // Se actualiza la vista html si el result retorna un objeto, significa que inserto en la bd. De lo contrario muestra el mensaje de error que retorna el server
  //   //     if (result.responseExSave.id) {
  //   //       //this.toastr.success('Mensaje enviado a: ' + this.nombreCliente);
  //   //       //console.log('Lo que se envia a la API: ', param);
  //   //       this.index += 1;
  //   //       this.increaseCounter();
  //   //       this.changeProgressBar(this.index);
  //   //       this.enviarTodos();
  //   //     } else {
  //   //       //console.log('result post: ', result);
  //   //       //this.toastr.warning(result);
  //   //     }
  //   //     //console.log('La respuesta de la api: ', result.responseExSave);
  //   //   },
  //   //   (error) => {
  //   //     // this.toastr.error(error.message, 'Error', {
  //   //     //   timeOut: 0,
  //   //     // });
  //   //   }
  //   // );
  // }
}
