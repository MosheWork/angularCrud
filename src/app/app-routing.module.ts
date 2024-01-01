import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HosListComponent } from './hos-list/hos-list.component';
import { MychartComponent } from './mychart/mychart.component';
import { UnitsComponent } from './units/units.component';
import { UsersComponent } from './users/users.component';
import { UploadPicComponent } from './upload-pic/upload-pic.component';
import { SQLComponent } from './sql/sql.component';
import { ReportEmployeesPerSectorComponent } from './report-employees-per-sector/report-employees-per-sector.component';
import { ConsiliumsComponent } from './consiliums/consiliums.component';
import { YourTableComponentComponent } from './your-table-component/your-table-component.component';
import { IsolationComponent } from './isolation/isolation.component';

const routes: Routes = [
  { path: 'units', component: UnitsComponent },
  { path: 'users', component: UsersComponent },
  { path: 'home', component: AppComponent },
  { path: 'hosList', component: HosListComponent },
  { path: 'chart', component: MychartComponent },
  { path: 'uploadPic', component: UploadPicComponent },
  { path: 'sql', component: SQLComponent },
  {
    path: 'report_employee_per_sector',
    component: ReportEmployeesPerSectorComponent,
  },
  { path: 'Consiliums', component: ConsiliumsComponent },
  { path: 'Isolation', component: IsolationComponent },
  { path: 'Test', component: YourTableComponentComponent },
];

@NgModule({
  imports: [CommonModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
