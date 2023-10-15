import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HosListComponent } from './hos-list/hos-list.component';
import { UnitsComponent } from './units/units.component';
import { UsersComponent } from './users/users.component';

const routes: Routes = [
  { path: 'units', component: UnitsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'home', component: AppComponent },
  { path: 'hosList', component: HosListComponent }
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
