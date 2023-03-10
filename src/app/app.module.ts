import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TurnosEnviadorComponent } from './pages/turnos-enviador/turnos-enviador.component';
@NgModule({
  declarations: [
    AppComponent,
    TurnosEnviadorComponent,
  ],
  imports: [
    CommonModule, // Se importa para el toastr
    BrowserModule,
    BrowserAnimationsModule, // Se importa para el toastr
    HttpClientModule, // Se importa
    AppRoutingModule,
    ToastrModule.forRoot() // Se importa para el toastr
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
