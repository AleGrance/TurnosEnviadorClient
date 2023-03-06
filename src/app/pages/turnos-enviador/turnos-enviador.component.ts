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
  cards: any;

  // Contadores
  contadorEnvioDiario: any = 0;
  contadorEnvioTotal = 0;

  // Datos del Mensaje de whatsapp
  contactoCliente = '';
  fileMimeTypeMedia: any = '';
  fileBase64Media: any = '';
  file = {
    fileBase64Media: '',
    fileMimeTypeMedia: '',
  };

  mensajePie = `Se ha registrado su turno! 😁
Para cualquier consulta, contáctanos llamando al 0214129000 o escribinos al siguiente link:
https://wa.me/595214129000`;
  textoAtencion =
    'ATENCIÓN: El turno debe ser Re confirmado con 24Hs de anticipación, en caso de no hacerlo el turno queda disponible para otro paciente. Para Re confirmar: 021-412-9000';

  // Formatear fecha
  pipe = new DatePipe('en-US');

  // La fecha y hora que se inició el enviador por ultima vez
  hoyAhora = new Date();
  fechaEjecucion = this.pipe.transform(this.hoyAhora, 'dd/MM/yyyy HH:mm');

  // Horario laboral del enviador
  horaEntrada = '07:00';
  horaSalida = '20:00';
  mood = 'Trabajando! 👨🏻‍💻';
  moodNotificado = 0;

  // Ticket
  ticket: object = {};

  // Numeros a quien notificar el estado
  numeros = [
    {
      NOMBRE: 'Alejandro',
      NRO_CEL: '595974107341',
    },
    {
      NOMBRE: 'José',
      NRO_CEL: '595985604619',
    },
    {
      NOMBRE: 'Johanna',
      NRO_CEL: '595974503024',
    },
  ];

  // Tiempo de retraso entre envios en milisegundos. Tener en cuenta los 6 segundos entre las funciones
  tiempoRetraso = 9000;
  // Tiempo de retraso entre ejecucion de consulta SQL para obtener los registros de los turnos
  tiempoRestrasoPSQL = 1000 * 60;

  ngOnInit(): void {
    this.getTurnosPendientes();
    // setInterval((): void => {
    //   let hoyAhora = new Date();
    //   let horaAhora: any = this.pipe.transform(hoyAhora, 'HH:mm');
    //   let diaHoy = horaAhora.toString().slice(0, 3);
    //   //console.log("Hoy es: ", diaHoy);
    //   if (horaAhora >= this.horaEntrada && horaAhora <= this.horaSalida) {
    //     if (this.moodNotificado === 0) {
    //       //this.notificarEstado('Online');
    //     }
    //     this.mood = 'Trabajando! 👨🏻‍💻';
    //     this.getTurnosPendientes();
    //     console.log("GET TURNOS - INICIA LOOP 15s", horaAhora);
    //   } else {
    //     if (this.moodNotificado === 1) {
    //       //this.notificarEstado('Offline');
    //     }
    //     this.mood = 'Durmiendo! 😴';
    //   }
    // }, this.tiempoRestrasoSQL);
  }

  // Get turnos - TurnosEnviador
  // Solamente los que estan pendiente de envío - API de Turnos
  getTurnosPendientes() {
    // La fecha y hora que se traen los datos del PSQL
    let hoyAhora = new Date();
    let fechaGetTurnos = this.pipe.transform(hoyAhora, 'dd/MM/yyyy HH:mm');

    this.api
      .get('turnosPendientes')
      .pipe(
        map((data) => {
          this.turnos = data;
          if (this.turnos.length === 0) {
            this.getTotaldeEnvios();
            this.toastr.warning(
              'Sin agendamientos pendientes de envio!',
              'Alerta!',
              {
                timeOut: 1000 * 60,
                progressBar: true,
              }
            );

            //Si no hay turnos nuevos cargados en el PSQL se vuelve a llamar al for luego de 15 seg
            setTimeout(() => {
              this.iniciarEnvio();
            }, this.tiempoRestrasoPSQL);
          } else {
            console.log(
              'Turnos pendientes de notificacion: ',
              this.turnos,
              fechaGetTurnos
            );

            // Si hay turnos nuevos se llama al for
            this.iniciarEnvio();
          }
        })
      )
      .subscribe({
        // next(result) {
        //   console.log('Resultado del post: ', result);
        // },
        error(msg) {
          alert('Error al traer los turnos PostgreSQL GET: ' + msg.message);
          console.log(
            'Error al traer los turnos PostgreSQL GET: ',
            msg.message
          );
        },
      });
  }

  funcionPromesa = (t: any, fechaEnvio: any) =>
    new Promise((r) => setTimeout(r, 1000))
      .then((res) => this.funcionUno(t, fechaEnvio))
      .then((res) => this.funcionDos(res))
      .then((res) => this.funcionTres(res, t.id_turno));

  async iniciarEnvio() {
    if (this.turnos.length === 0) {
      this.toastr.info('Sin turnos por el momento!', 'Alerta!', {
        timeOut: 1000,
        progressBar: true,
      });
    }

    for (let t of this.turnos) {
      // La fecha y hora que se envia el mensaje
      let hoyAhora = new Date();
      let fechaEnvio = this.pipe.transform(hoyAhora, 'dd/MM/yyyy HH:mm');
      // Se resetean las variables
      this.ticket = {};
      (<HTMLInputElement>document.getElementById('card')).innerHTML = '';
      this.contactoCliente = '';
      // Se guardan las variables globales
      this.contactoCliente = t.TELEFONO_MOVIL;

      await this.funcionPromesa(t, fechaEnvio);
    }

    console.log('Finalizo el envio, se consulta a la base luego de 1 minuto');

    this.toastr.info('Consultando nuevos turnos...', 'Finalizo el envío!', {
      timeOut: 1000 * 60,
      progressBar: true,
    });

    setTimeout(() => {
      // console.log(
      //   'Se consulto a la base y se trajeron nuevos turnos pendientes'
      // );
      this.getTurnosPendientes();
    }, 1000 * 60);
  }

  // Renderiza la imagen en el HTML
  async funcionUno(t: any, fechaEnvio: any) {
    console.log('UNO - Renderizar imagen');
    let retraso = () => new Promise((r) => setTimeout(r, 5000));
    // Se crea un obj de la imagen para pasar a la sgt funcion. Tambien se puede hacer global pero mejor probar local por el momento para evitar err

    // Aca se forma la tarjeta con los datos del turno
    this.cards =
      `
    <img class="card-img-top" src="../../../assets/img/odontos.svg" alt="Card image cap" id="imagen">
    <div class="card-body" id="card-body" style="background-color: white;">
      <h6 class="card-title">` +
      t.CLIENTE +
      `</h6>
    <p class="card-text" style="margin-bottom: 0px">` +
      t.PLAN_CLIENTE +
      `</p>
    <p class="card-text" style="margin-top: 0px; margin-bottom: 2px">` +
      t.NRO_CERT +
      `</p>
          <h5 class="card-title" style="margin: 0px;">Fecha: ` +
      t.FECHA +
      `</h5>
          <h5 class="card-title" style="margin-top: 0px;">Hora: ` +
      t.HORA +
      `</h5>
          <h6 class="card-subtitle mb-2 text-muted">Sucursal: ` +
      t.SUCURSAL +
      `</h6>
    <p class="card-text" style="margin-top: 0px;"><small class="text-muted">` +
      t.DIRECCION +
      `</small></p>

          <h6 class="card-subtitle mb-2 text-muted">` +
      t.NOMBRE_COMERCIAL +
      `</h6>

    <p class="card-text" style="margin-bottom: 2px">` +
      this.textoAtencion +
      `</p>

    <p class="card-text" style="margin: 0px;">` +
      fechaEnvio +
      `</p>
    </div>
    `;

    // Aca se escribe en el DOM
    (<HTMLInputElement>document.getElementById('card')).innerHTML = this.cards;
    console.log(' -Imagen renderizada');
    console.log(' -Crear imagen en base64');

    setTimeout(() => {
      let node = <HTMLInputElement>document.getElementById('card');
      //console.log(node);

      htmlToImage
        .toJpeg(node)
        .then((dataUrl) => {
          var img = new Image();
          img.src = dataUrl;

          this.fileMimeTypeMedia = img.src.split(';base64,')[0];
          this.fileMimeTypeMedia = this.fileMimeTypeMedia.slice(5);
          this.fileBase64Media = img.src.split(',')[1];

          this.file.fileBase64Media = this.fileBase64Media;
          this.file.fileMimeTypeMedia = this.fileMimeTypeMedia;
        })
        .then(() => {
          console.log(' -Imagen en base64 creada');
          //console.log(' -File primero', this.file);
        })
        .catch(function (error) {
          console.error('Error al crear la imagen!', error);
        });
    }, 2000);

    await retraso();
  }

  // Crear el objeto mensaje a enviar a la API de WhatsappWeb
  funcionDos(res: any) {
    console.log('DOS - Crear objeto de mensaje para enviar');
    let objWa = {};

    objWa = {
      message: this.mensajePie,
      phone: this.contactoCliente,
      mimeType: this.file.fileMimeTypeMedia,
      data: this.file.fileBase64Media,
      fileName: '',
      fileSize: 0,
    };

    console.log(' -Objeto creado');
    //console.log(' -Objeto creado', objWa);
    return objWa;
  }

  // Se envia el objeto del mensaje a la API de WhatsappWeb
  async funcionTres(res: any, id_turno: any) {
    console.log('TRES - Enviar a la API', id_turno);
    console.log(' Tercero', res);
    let retraso = () => new Promise((r) => setTimeout(r, this.tiempoRetraso));

    this.apiEnviador
      .post('lead', res)
      .pipe(
        map((data: any) => {
          // Si no se reconoce el nro
          if (data.responseExSave.unknow) {
            //console.log('Error SIN WHATSAPP nro: ', objWa.phone);
            // Se puede auto enviar un mensaje indicando que no se envió por X problema
            //this.notificarError(objWa.phone, idTurno, cliente);
            this.contactoCliente = '';
            this.updateEstatusUNKNOW(id_turno);
          }
          // Si hay algun error se pasa el codigo del error
          if (data.responseExSave.error) {
            //console.log('Error en este nro: ', objWa.phone);
            // Se puede auto enviar un mensaje indicando que no se envió por X problema
            //this.notificarError(objWa.phone, idTurno, cliente);
            this.contactoCliente = '';
            const errMsg = data.responseExSave.error.slice(0, 17);
            if (errMsg === 'Escanee el código') {
              this.updateEstatusERROR(id_turno, 104);
            }
            // Indica que se cerró la sesion o la ventana. Envios se iniciar al abrir la sesion o la ventana
            if (errMsg === 'Protocol error (R') {
              this.updateEstatusERROR(id_turno, 105);
            }
            // Indica que el campo nro esta mal escrito
            if (errMsg === 'Evaluation failed') {
              this.updateEstatusERROR(id_turno, 106);
            }
          }
          // Si el envio fue exitoso
          if (data.responseExSave.id) {
            this.contactoCliente = '';
            console.log(' -ENVIO CORRECTO id_turno: ', id_turno);
            this.updateEstatusOK(id_turno);
          }
        })
      )
      .subscribe({
        // next(result: any) {
        //   console.log('Resultado: ', result);
        // },
        error(msg) {
          //console.log('Error en la consulta POST: ', msg.message);
        },
      });

    await retraso();
  }

  // Una vez que el envio haya sido exitoso. Se actualiza el estado del turno en la DB PostgreSQL
  updateEstatusOK(idTurno: any) {
    // Se crea el objeto turno con el campo estado_envio modificado a 1
    let objTurno = {
      estado_envio: 1,
    };

    this.api
      .put('turnos/' + idTurno, objTurno)
      .pipe(
        map((data: any) => {
          let estatusOk;
          estatusOk = data;
          console.log(
            'CUATRO - Se actualiza el estado del envio PUT STATUS OK: ',
            estatusOk
          );
          this.getTotaldeEnvios();
        })
      )
      .subscribe({
        // next(result: any) {
        //   console.log('Resultado del PUT ENVIO CORRECTO: ', result);
        // },
        error(msg) {
          //console.log('Error en actualizar estado PUT STATUS OK: ', msg.message);
        },
      });
  }

  // Si el numero no tiene whatsapp
  updateEstatusUNKNOW(idTurno: any) {
    let objTurno = {
      estado_envio: 3,
    };

    this.api.put('turnos/' + idTurno, objTurno).subscribe({
      next(result: any) {
        // console.log(
        //   'Resultado del PUT luego actualizar estado NRO SIN WHATSAPP: ',
        //   result
        // );
      },
      error(msg) {
        //console.log('Error en la consulta PUT NRO SIN WHATSAPP: ', msg.message);
      },
    });
  }

  // Para otros casos de error por ej devincualcion del cel o cierre de ventana enviador
  updateEstatusERROR(idTurno: any, cod_error: any) {
    // Se crea el objeto turno con el campo estado_envio modificado a 3. Indica que no tiene whatsapp
    let objTurno = {
      estado_envio: cod_error,
    };

    this.api.put('turnos/' + idTurno, objTurno).subscribe({
      next(result: any) {
        // console.log(
        //   'Resultado del PUT luego actualizar estado NRO SIN WHATSAPP: ',
        //   result
        // );
      },
      error(msg) {
        //console.log('Error en la consulta PUT NRO SIN WHATSAPP: ', msg.message);
      },
    });
  }

  // Traer la cantidad de envios realizados
  getTotaldeEnvios() {
    this.api
      .get('turnosNotificados')
      .pipe(
        map((data) => {
          let contador = data;
          this.contadorEnvioDiario = contador;
          //console.log("Total de envios Hoy: ", contador);
        })
      )
      .subscribe({
        // next(result) {
        //   console.log('Resultado del post: ', result);
        // },
        error(msg) {
          // console.log(
          //   'Error al traer los turnos turnos NOTIFICADOS: ',
          //   msg.message
          // );
        },
      });
  }

  // Notifica el estado del Enviador cada vez que cambie de estado
  notificarEstado(estadoActual: any) {
    let hoyAhora = new Date();
    let fechaEnvioEstado = this.pipe.transform(hoyAhora, 'dd/MM/yyyy HH:mm');

    if (estadoActual === 'Online' && this.moodNotificado === 0) {
      // Envia la notificacion a los numeros cargados en el array
      for (let n of this.numeros) {
        let objWa = {
          message:
            `Enviador de turnos iniciado! 👨🏻‍💻
Atte: El Enviador de turnos.
Fecha: ` +
            fechaEnvioEstado +
            ``,
          phone: n.NRO_CEL,
          mimeType: '',
          data: '',
          fileName: '',
          fileSize: 0,
        };

        this.apiEnviador.post('lead', objWa).subscribe({
          next(result: any) {
            //console.log('Resultado de la notificación: ', result);
          },
          error(msg) {
            //console.log('Error en la petición POST: ', msg.message);
          },
        });
      }

      // Cambia el valor de moodNotificado si se envió el mensaje
      this.moodNotificado = 1;
    }

    if (estadoActual === 'Offline' && this.moodNotificado === 1) {
      // Envia la notificacion a los numeros cargados en el array
      for (let n of this.numeros) {
        let objWa = {
          message:
            `Enviador de turnos detenido! 😴
Total enviados hoy: ` +
            this.contadorEnvioDiario +
            `
Atte: El Enviador de turnos.
Fecha: ` +
            fechaEnvioEstado +
            ``,
          phone: n.NRO_CEL,
          mimeType: '',
          data: '',
          fileName: '',
          fileSize: 0,
        };

        this.apiEnviador.post('lead', objWa).subscribe({
          next(result: any) {
            //console.log('Resultado de la notificación: ', result);
          },
          error(msg) {
            //console.log('Error en la petición POST: ', msg.message);
          },
        });
      }

      // Cambia el valor de moodNotificado si se envió el mensaje
      this.moodNotificado = 0;
    }
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
        //console.log('Resultado de la notificación: ', result);
      },
      error(msg) {
        //console.log('Error en la petición POST: ', msg.message);
      },
    });
  }
}
