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
  contadorEnvioDiario: any = 0;
  contadorEnvioTotal = 0;

  // Datos del Mensaje de whatsapp
  fileMimeTypeMedia = '';
  fileBase64Media = '';
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
  fechaEnvio: any = '';

  // Horario laboral del enviador
  horaEntrada = '07:00';
  horaSalida = '20:00';
  mood = 'Trabajando! 👨🏻‍💻';
  moodNotificado = 0;

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

  // Tiempo de retraso entre envios en milisegundos
  tiempoRetraso = 14000;
  // Tiempo de retraso entre ejecucion de consulta SQL para obtener los registros de los turnos
  tiempoRestrasoSQL = 15000 * 60;

  ngOnInit(): void {
    this.getTurnosPendientes();

    setInterval((): void => {
      let hoyAhora = new Date();
      let horaAhora: any = this.pipe.transform(hoyAhora, 'HH:mm');
      let diaHoy = horaAhora.toString().slice(0, 3);
      //console.log("Hoy es: ", diaHoy);

      if (horaAhora >= this.horaEntrada && horaAhora <= this.horaSalida) {
        if (this.moodNotificado === 0) {
          //this.notificarEstado('Online');
        }
        this.mood = 'Trabajando! 👨🏻‍💻';
        this.getTurnosPendientes();
      } else {
        if (this.moodNotificado === 1) {
          //this.notificarEstado('Offline');
        }
        this.mood = 'Durmiendo! 😴';
      }
    }, this.tiempoRestrasoSQL);
  }

  // Get turnos - TurnosEnviador
  // Solamente los que estan pendiente de envío - API de Turnos
  getTurnosPendientes() {
    let hoyAhora = new Date();
    // La fecha de envio que se adjunta a la imagen
    this.fechaEnvio = this.pipe.transform(hoyAhora, 'dd/MM/yyyy HH:mm');

    this.api
      .get('turnosPendientes')
      .pipe(
        map((data) => {
          this.turnos = data;
          if (this.turnos.length === 0) {
            this.getTotaldeEnvios();
            //console.log('Sin agendamientos pendientes de envio!');
            this.toastr.warning(
              'Sin agendamientos pendientes de envio!',
              'Alerta!',
              {
                timeOut: 10000 * 60,
              }
            );
            return;
          }
          this.iniciarEnvio();
          //console.log('Turnos pendientes de notificacion: ', this.turnos, this.fechaEnvio);
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

  // Funcion de retraso para el for()
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async iniciarEnvio() {
    if (this.turnos.length === 0) {
      this.toastr.warning('Sin turnos por el momento!', 'Alerta!');
    }

    //this.showSpinner();

    for (let t of this.turnos) {
      //let fecha_turno = this.pipe.transform(t.fecha_turno, 'dd/MM/yyyy');
      let fecha_turno = t.FECHA;
      let hora_turno = t.HORA;
      let profesional = t.NOMBRE_COMERCIAL; // Doctor
      let sucursal = t.SUCURSAL;
      let dir_sucursal = t.DIRECCION;
      //let tel_sucursal = '021-412-9000';
      let cliente = t.CLIENTE;
      let plan_cliente = t.PLAN_CLIENTE;
      let nro_cert_cliente = t.NRO_CERT;
      let contacto = t.TELEFONO_MOVIL;
      let id = t.id_turno;

      // Se crea la variable del ID del turno. para modificar su estado una vez que se envie el mensaje
      let idTurno = t.id_turno;

      // Aca se forma la tarjeta con los datos del turno
      this.cards =
        `
        <img class="card-img-top" src="../../../assets/img/odontos.svg" alt="Card image cap" id="imagen">
        <div class="card-body" id="card-body" style="background-color: white;">
          <h6 class="card-title">` +
        cliente +
        `</h6>
        <p class="card-text" style="margin-bottom: 0px">` +
        plan_cliente +
        `</p>
        <p class="card-text" style="margin-top: 0px; margin-bottom: 2px">` +
        nro_cert_cliente +
        `</p>
              <h5 class="card-title" style="margin: 0px;">Fecha: ` +
        fecha_turno +
        `</h5>
              <h5 class="card-title" style="margin-top: 0px;">Hora: ` +
        hora_turno +
        `</h5>
              <h6 class="card-subtitle mb-2 text-muted">Sucursal: ` +
        sucursal +
        `</h6>
        <p class="card-text" style="margin-top: 0px;"><small class="text-muted">` +
        dir_sucursal +
        `</small></p>

              <h6 class="card-subtitle mb-2 text-muted">` +
        profesional +
        `</h6>

        <p class="card-text" style="margin-bottom: 2px">` +
        this.textoAtencion +
        `</p>

        <p class="card-text" style="margin: 0px;">` +
        this.fechaEnvio +
        `</p>
        </div>
        `;

      // Aca se escribe en el DOM
      (<HTMLInputElement>document.getElementById('card')).innerHTML =
        this.cards;

      // Se retrasa la llamada a la función debido a que el DOM no renderiza de inmediato el logo de odontos
      setTimeout(() => {
        this.crearImg(contacto, idTurno, cliente);
      }, 1000);

      // Se llama a la funcion de retraso para ejecutar todo cada 5 segundos
      await this.sleep(this.tiempoRetraso);
    }
    this.turnos = [];
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
      message: this.mensajePie,
      phone: contacto,
      mimeType: mimeType,
      data: base64,
      fileName: '',
      fileSize: 0,
    };
    //console.log("Lo que se envia: ", objWa);
    this.enviarMensaje(objWa, idTurno, cliente);
  }

  // Se envia el mensaje atravez de la API de WhatsappWeb
  enviarMensaje(objWa: any, idTurno: any, cliente: any) {
    //let turnoId = this.idTurno;
    this.apiEnviador
      .post('lead', objWa)
      .pipe(
        map((data: any) => {
          let objetoRetorno;
          objetoRetorno = data;
          //console.log('Este es el objeto retorno POST: ', objetoRetorno);

          if (data.responseExSave.unknow) {
            //console.log('Error SIN WHATSAPP nro: ', objWa.phone);
            // Se puede auto enviar un mensaje indicando que no se envió por X problema
            //this.notificarError(objWa.phone, idTurno, cliente);
            this.updateEstatusERROR(idTurno);
          }

          if (data.responseExSave.error) {
            //console.log('Error en este nro: ', objWa.phone);
            // Se puede auto enviar un mensaje indicando que no se envió por X problema
            //this.notificarError(objWa.phone, idTurno, cliente);
            this.updateEstatusERROR(idTurno);
          }

          // Si el envio fue exitoso
          if (data.responseExSave.id) {
            //console.log('ENVIO CORRECTO id_turno: ', idTurno);
            this.updateEstatusOK(idTurno);
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
  }

  // Una vez que el envio haya sido exitoso. Se actualiza el estado del turno en la DB PostgreSQL
  updateEstatusOK(idTurno: any) {
    // Se crea el objeto turno con el campo estado_envio modificado a 1
    let objTurno = {
      estado_envio: 1,
    };

    this.api.put('turnos/' + idTurno, objTurno)
    .pipe(
      map((data: any) => {
        let estatusOk;
        estatusOk = data;
        //console.log('Se actualiza el estado del envio PUT STATUS OK: ', estatusOk);
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

  // Si el envio no fue exitoso se cambia el estado del turno registrado
  updateEstatusERROR(idTurno: any) {
    // Se crea el objeto turno con el campo estado_envio modificado a 3
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

  // No funciona - VER DE ARREGLAR
  detenerEnvio() {
    //console.log('DETENIDO!');
    this.turnos = [];
    return;
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

  // Notifica el estado del Enviador cada vez que cambie de estado
  notificarEstado(estadoActual: any) {
    let hoyAhora = new Date();
    let fechaEnvioEstado = this.pipe.transform(hoyAhora, 'dd/MM/yyyy HH:mm');

    if (estadoActual === 'Online' && this.moodNotificado === 0) {
      // Envia la notificacion a los numeros cargados en el array
      for (let n of this.numeros) {
        let objWa = {
          message: `Enviador de turnos iniciado! 👨🏻‍💻
Atte: El Enviador de turnos.
Fecha: `+fechaEnvioEstado+``,
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
Fecha: `+fechaEnvioEstado+``,
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
}
