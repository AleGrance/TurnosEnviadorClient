import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EnviadorComponent } from './pages/enviador/enviador.component';
import { TurnosEnviadorComponent } from './pages/turnos-enviador/turnos-enviador.component';



const routes: Routes = [
  {
    path: '',
    redirectTo: '/turnos',
    pathMatch: 'full'
  },
  {
    path: 'enviador', component: EnviadorComponent,
    //canActivate: [AuthGuard]
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
