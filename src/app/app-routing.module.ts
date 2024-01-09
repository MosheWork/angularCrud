import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HosListComponent } from './old/hos-list/hos-list.component';
import { MychartComponent } from './mychart/mychart.component';
import { UsersComponent } from './users/users.component';
import { UploadPicComponent } from './upload-pic/upload-pic.component';
import { SQLComponent } from './sql/sql.component';
import { ConsiliumsComponent } from './consiliums/consiliums.component';
import { YourTableComponentComponent } from './your-table-component/your-table-component.component';
import { IsolationComponent } from './isolation/isolation.component';
import { HospitalizationsListComponent } from './hospitalizations-list/hospitalizations-list.component';

const routes: Routes = [
  { path: 'users', component: UsersComponent },
  { path: 'home', component: AppComponent },
  { path: 'HospitalizationsList', component: HospitalizationsListComponent },
  { path: 'chart', component: MychartComponent },
  { path: 'uploadPic', component: UploadPicComponent },
  { path: 'sql', component: SQLComponent },
  
  { path: 'Consiliums', component: ConsiliumsComponent },
  { path: 'Isolation', component: IsolationComponent },
  { path: 'Test', component: YourTableComponentComponent },
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
