import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/services/api.service';
import { ToastrService } from 'ngx-toastr';
import * as XLSX from 'xlsx';
import { ApienviadorService } from 'src/app/services/apienviador.service';

@Component({
  selector: 'app-enviador',
  templateUrl: './enviador.component.html',
  styleUrls: ['./enviador.component.css'],
})
export class EnviadorComponent implements OnInit {
  // Para enviar el mensaje
  turnos: any;
  // Nombre del archivo que se muestra en el html
  fileNameXLS = 'Subir un archivo XLS/XLSX/ODS...';
  fileTypeExcel = '';

  // Fecha para controlar la cantidad de envíos por fecha
  fechaHoy: any;
  fechaAlmacenada: any;

  // Contador de envíos
  contadorEnvios = 0;
  limitePorDía = 500;
  tiempoRestraso = 15000;

  // Para enviar el mensaje
  clientesWa: any[] = [];
  //mensajeSaludo = '';
  mensajeWa = '';
  nombreCliente = '';
  numeroCliente = '';
  index = 0;
  objWa = {
    message: '',
    phone: '',
    mimeType: '',
    data: '',
    fileName: '',
    fileSize: 0,
  };
  progressBarText = '';

  // Para el envio del adjunto
  error = '';
  fileInput: any;
  fileMimeTypeMedia = '';
  fileBase64Media: string = '';
  fileNameMedia = 'Subir un archivo JPG/PDF...';
  fileSizeMedia = 0;

  constructor(private api: ApienviadorService, private toastr: ToastrService) {}

  ngOnInit(): void {
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();

    this.fechaHoy = dd + '/' + mm + '/' + yyyy;

    if (!localStorage.getItem('Contador')) {
      localStorage.setItem('Contador', this.contadorEnvios.toString());
    } else {
      this.checkCounter();
    }

    if (!localStorage.getItem('Fecha')) {
      localStorage.setItem('Fecha', this.fechaHoy);
    } else {
      this.checkDates();
    }
  }

  // Comparar las fechas
  checkDates() {
    this.fechaAlmacenada = localStorage.getItem('Fecha');
    if (this.fechaAlmacenada != this.fechaHoy) {
      localStorage.setItem('Fecha', this.fechaHoy);
      this.resetCounter();
    }
  }

  // Check counter return number
  checkCounter() {
    let contadorStorage: any = localStorage.getItem('Contador');
    this.contadorEnvios = parseFloat(contadorStorage);
    console.log('Envios realizados el dia de hoy: ', this.contadorEnvios);
  }

  // Reset contador
  resetCounter() {
    this.contadorEnvios = 0;
    localStorage.setItem('Contador', this.contadorEnvios.toString());
  }

  // Update counter
  increaseCounter() {
    this.contadorEnvios += 1;
    localStorage.setItem('Contador', this.contadorEnvios.toString());
  }

  // Escribir mensaje y cargar el texto en una variable.
  onChangeTextArea(e: any) {
    this.mensajeWa = (<HTMLInputElement>(
      document.getElementById('mensajeEscrito')
    )).value;
  }

  // Al escribir el saludo
  // onChangeSaludo(e: any) {
  //   this.mensajeSaludo = (<HTMLInputElement>(
  //     document.getElementById('saludo')
  //   )).value;
  // }

  // Al seleccionar el archivo XLS
  handleXLSFile(event: any) {
    // the only MIME types allowed
    const allowed_types = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet',
    ];

    this.index = 0;
    this.clientesWa = [];
    this.nombreCliente = '';

    const files = event.target.files;

    // Se recorre el array que contiene el archivo y se obtiene el nombre del archivo para mostrar en el html
    for (let fi of files) {
      this.fileNameXLS = fi.name;
      this.fileTypeExcel = fi.type;
    }

    //console.log(this.fileTypeExcel);

    if (!allowed_types.includes(this.fileTypeExcel)) {
      //define the error message due to wrong MIME type
      let error = 'Los archivos permitidos son: ( XLS | XLSX | ODS )';
      // show an error alert for MIME
      this.toastr.error(error, 'Error');
      this.fileNameXLS = 'ERROR';
      //return false since the MIME type is wrong
      return;
    }

    if (files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const wb = XLSX.read(event.target.result);
        const sheets = wb.SheetNames;

        if (sheets.length) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheets[0]]);
          this.clientesWa = rows;
          //console.log(this.clientesWa);

          for (let i = 0; i < this.clientesWa.length; i++) {
            if (i === this.index) {
              //console.log(this.clientesWa[this.index]);
              this.nombreCliente = this.clientesWa[this.index].NOMBRE;
              this.numeroCliente = this.clientesWa[this.index].NRO_CEL;
            }
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  // Al seleccionar el archivo JPEG o PDF
  handleMediaFile(fileToUpload: any) {
    this.fileInput = fileToUpload.target.files[0];
    this.fileNameMedia = this.fileInput.name;
    this.fileSizeMedia = this.fileInput.size;
    //console.log(this.fileInput);

    // check for image to upload
    // this checks if the user has uploaded any file
    if (fileToUpload.target.files && fileToUpload.target.files[0]) {
      // calculate your image sizes allowed for upload
      const max_size = 20971510;
      // the only MIME types allowed
      const allowed_types = ['image/png', 'image/jpeg', 'image/jpg'];
      // max image height allowed
      const max_height = 1080;
      //max image width allowed
      const max_width = 720;

      // check the file uploaded by the user
      // if (this.fileInput.size > max_size) {
      //   //show error
      //   this.error = 'max image size allowed is ' + max_size / 1000 + 'Mb';
      //   //show an error alert using the Toastr service.
      //   this.toastr.error(this.error, 'Error');
      //   return;
      // }

      //check for allowable types
      // if (!allowed_types.includes(this.fileInput.type)) {
      //   // define the error message due to wrong MIME type
      //   let error = 'Los archivos permitidos son: ( JPEG | JPG | PNG )';
      //   // show an error alert for MIME
      //   this.toastr.error(error, 'Error');
      //   //return false since the MIME type is wrong
      //   return;
      // }

      // define a file reader constant
      const reader = new FileReader();
      // read the file on load
      reader.onload = (e: any) => {
        // create an instance of the Image()
        const image = new Image();
        // get the image source
        image.src = e.target.result;

        image.onload = (rs) => {
          // get the image height read
          // const img_height = image.height;
          // // get the image width read
          // const img_width = image.width;
          // check if the dimensions meet the required height and width
          // if (img_height > max_height && img_width > max_width) {
          //   console.log('Imagen medida!');
          //   // throw error due to unmatched dimensions
          //   this.error =
          //     'Maximum dimensions allowed: ' +
          //     max_height +
          //     '*' +
          //     max_width +
          //     'px';
          //   this.toastr.error(this.error, 'Error');
          //   return;
          // } else {
          //   // otherise get the base64 image
          //   this.fileMimeTypeMedia = image.src.split(';base64,')[0];
          //   this.fileMimeTypeMedia = this.fileMimeTypeMedia.slice(5);
          //   this.fileBase64Media = image.src.split(',')[1];
          //   // console.log("Mime type: ",this.fileMimeTypeMedia);
          //   // console.log("Base64: ", this.fileBase64Media);
          //   // console.log("Name: ", this.fileNameMedia);
          //   // console.log("Type: ", this.fileSizeMedia);
          // }
        };

        this.fileMimeTypeMedia = image.src.split(';base64,')[0];
        this.fileMimeTypeMedia = this.fileMimeTypeMedia.slice(5);
        this.fileBase64Media = image.src.split(',')[1];

        this.objWa.mimeType = this.fileMimeTypeMedia;
        this.objWa.data = this.fileBase64Media;
        this.objWa.fileSize = this.fileSizeMedia;

        if (this.fileMimeTypeMedia === 'application/pdf') {
          this.objWa.fileName = this.mensajeWa;
        }

        // console.log('Mime type: ', this.fileMimeTypeMedia);
        // console.log('Base64: ', this.fileBase64Media);
        // console.log('Name: ', this.fileNameMedia);
        // console.log('Size: ', this.fileSizeMedia);
      };
      // reader as data url
      reader.readAsDataURL(fileToUpload.target.files[0]);
      //console.log(reader);
    }
  }

  // Envia el mensaje uno por uno -- UNO POR UNO
  enviarMensaje() {
    // Si no hay archivo seleccionado se muestra el mensaje de alerta
    if (this.clientesWa.length === 0) {
      this.toastr.error('Seleccionar un archivo!' + this.nombreCliente);
      return;
    }

    if (this.index > this.clientesWa.length - 1) {
      window.alert('Ya se envio a todos los de la lista!');
      return;
    }

    this.objWa.message = this.mensajeWa;
    this.objWa.phone = this.numeroCliente;

    this.api.post('lead', this.objWa).subscribe(
      (result: any) => {
        //Se actualiza la vista html si el result retorna un objeto, significa que inserto en la bd. De lo contrario muestra el mensaje de error que retorna el server
        if (typeof result === 'object') {
          this.toastr.success('Mensaje enviado a: ' + this.nombreCliente);
          this.index += 1;
          this.changeProgressBar(this.index);
          this.recorrerArray();
        } else {
          //console.log('result post: ', result);
          this.toastr.warning(result);
        }
        //console.log('La respuesta de la api: ', result.responseExSave);
      },
      (error) => {
        console.log('Hay error en el metodo post: ', error);
        this.toastr.error(error, 'Error', { timeOut: 0 });
      }
    );

    //console.log('Lo que se envia a la api: ', this.objWa);
  }

  // Recorre el array de clientes y muestra el siguiente contacto a enviar -- UNO POR UNO
  recorrerArray() {
    for (let i = 0; i < this.clientesWa.length; i++) {
      if (i === this.index) {
        this.numeroCliente = this.clientesWa[i].NRO_CEL;
        this.nombreCliente = this.clientesWa[i].NOMBRE;
      }
    }
  }

  // Envia el mensaje a todos lo de la lista cada 25 seg -- MASIVO CONTINUO
  enviarTodos() {
    // Si no hay archivo seleccionado se muestra el mensaje de alerta
    if (this.clientesWa.length === 0) {
      this.toastr.error('Subir un archivo!');
      return;
    }

    // Si no se escribió el mensaje
    if (this.mensajeWa.length === 0) {
      this.toastr.error('Escriba un mensaje!');
      return;
    }

    // Si supera la cantidad establecida por día
    if (this.contadorEnvios > this.limitePorDía) {
      this.toastr.error(
        'El enviador masivo detectó que se ha superado el límite de envíos por día',
        'Error',
        {
          timeOut: 0,
        }
      );
      return;
    }

    // Si ya se recorrió toda la lista
    if (this.index > this.clientesWa.length - 1) {
      setTimeout(() => {
        this.toastr.info('Se completó el envío masivo!', 'Enviador Alert', {
          timeOut: 0,
        });
      }, 1000);

      this.resetFormulario();
      return;
    }

    this.showProgressBar();

    for (let i = 0; i < this.clientesWa.length; i++) {
      if (i === this.index) {
        this.objWa.phone = this.clientesWa[i].NRO_CEL;
        this.nombreCliente = this.clientesWa[i].NOMBRE;
        //this.objWa.message = this.mensajeSaludo + " " + this.nombreCliente + ". " + this.mensajeWa;
        this.objWa.message = this.mensajeWa;
        if (!this.clientesWa[i].NRO_CEL) {
          this.toastr.error('El campo NUMERO_CEL en la fila '+(i+2)+' esta vacio. Revise la planilla!', 'Enviador Alert', {
            timeOut: 0,
          });
          return;
        }
        this.envioRetrasado(this.objWa);
      }
    }
  }

  // Funcion POST que retrasa el envio -- MASIVO CONTINUO
  envioRetrasado(param: any) {
    setTimeout(() => {
      this.api.post('lead', this.objWa).subscribe(
        (result: any) => {
          // Checks if there is an error in the response before continue
          if (result.responseExSave.error) {
            const errMsg = result.responseExSave.error.slice(0, 17);
            //console.log(errMsg);

            if (errMsg === 'Escanee el código') {
              this.toastr.error(
                result.responseExSave.error +
                  " <a href='./assets/img/qr.svg' target='_blank'>Aqui</a>",
                'Error',
                {
                  timeOut: 0,
                  enableHtml: true,
                }
              );
              this.resetFormulario();
              return;
            }

            if (errMsg === 'Protocol error (R') {
              this.toastr.error(
                'Se ha cerrado la sesión, inicie nuevamente escaneando el código ' +
                  " <a href='./assets/img/qr.svg' target='_blank'>Aqui</a>" +
                  '. Antes de escanear el código reinicie la aplicación y actualice con F5 la pestaña de la imagen QR.',
                'Error',
                {
                  timeOut: 0,
                  enableHtml: true,
                }
              );
              this.resetFormulario();
              return;
            }

            if (errMsg === 'Evaluation failed') {
              window.alert(
                'Verificar el numero: ' +
                  this.numeroCliente +
                  ' se ha detenido el envío en este registro'
              );

              this.toastr.error(result.responseExSave.error, 'Error', {
                timeOut: 0,
              });
              this.resetFormulario();
              return;
            }

            this.toastr.error(result.responseExSave.error, 'Error', {
              timeOut: 0,
            });
            this.resetFormulario();
            return;
          }

          //Se actualiza la vista html si el result retorna un objeto, significa que inserto en la bd. De lo contrario muestra el mensaje de error que retorna el server
          if (result.responseExSave.id) {
            //this.toastr.success('Mensaje enviado a: ' + this.nombreCliente);
            //console.log('Lo que se envia a la API: ', param);
            this.index += 1;
            this.increaseCounter();
            this.changeProgressBar(this.index);
            this.enviarTodos();
          } else {
            //console.log('result post: ', result);
            this.toastr.warning(result);
          }
          //console.log('La respuesta de la api: ', result.responseExSave);
        },
        (error) => {
          this.toastr.error(error.message, 'Error', {
            timeOut: 0,
          });
        }
      );
      // Tiempo de retraso de envio en milisegundos
    }, this.tiempoRestraso);
  }

  // Se oculta el boton y se muestra el progressbar
  showProgressBar() {
    (<HTMLInputElement>document.getElementById('enviarTodos')).style.display =
      'none';
    (<HTMLInputElement>document.getElementById('progressBar')).style.display =
      'block';
    (<HTMLInputElement>document.getElementById('labelEnviando')).style.display =
      'block';
  }

  // Se resetea el formulario
  resetFormulario() {
    this.clientesWa = [];
    this.fileNameXLS = 'Subir un archivo XLS/XLSX/ODS...';
    this.deleteMediaFile();
    //this.mensajeSaludo = '';
    this.mensajeWa = '';
    (<HTMLInputElement>document.getElementById('excelFile')).value = '';
    //(<HTMLInputElement>document.getElementById('saludo')).value = '';
    (<HTMLInputElement>document.getElementById('mensajeEscrito')).value = '';
    (<HTMLInputElement>document.getElementById('enviarTodos')).style.display =
      'block';
    (<HTMLInputElement>document.getElementById('labelEnviando')).style.display =
      'none';
    (<HTMLInputElement>document.getElementById('progressBar')).style.display =
      'none';
  }

  // Eliminar la imagen seleccionada
  deleteMediaFile() {
    (<HTMLInputElement>document.getElementById('mediaFile')).value = '';
    this.fileNameMedia = 'Subir un archivo JPG/PDF...';
    this.objWa.mimeType = '';
    this.objWa.data = '';
  }

  // Cambia el estado del progressBar
  changeProgressBar(valor: any) {
    let porcent = (valor * 100) / this.clientesWa.length;
    (<HTMLInputElement>document.getElementById('progressBar')).style.width =
      porcent + '%';
    (<HTMLInputElement>document.getElementById('progressBar')).style.width =
      porcent + '%';
    //this.progressBarText = "Enviando " + this.index + " de " + this.clientesWa.length;
    this.progressBarText = 'Enviando ' + porcent.toFixed(0) + '%';
  }
}
