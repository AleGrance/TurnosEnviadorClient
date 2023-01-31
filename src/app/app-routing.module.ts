import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TurnosEnviadorComponent } from './pages/turnos-enviador/turnos-enviador.component';



const routes: Routes = [
  {
    path: '',
    redirectTo: '/turnos',
    pathMatch: 'full'
  },
  {
    path: 'turnos', component: TurnosEnviadorComponent,
    //canActivate: [AuthGuard]
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
