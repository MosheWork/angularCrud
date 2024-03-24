import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EmpAddEditComponent } from './emp-add-edit/emp-add-edit.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UsersComponent } from './users/users.component';
import { HosListComponent } from './old/hos-list/hos-list.component';
import { MychartComponent } from './mychart/mychart.component';
import { UploadPicComponent } from './upload-pic/upload-pic.component';
import { PicturesComponent } from './pictures/pictures.component';
import { SQLComponent } from './sql/sql.component';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FooterComponent } from './footer/footer.component';
import { ConsiliumsComponent } from './consiliums/consiliums.component';
import { MatTableDataSource } from '@angular/material/table';
import { YourTableComponentComponent } from './your-table-component/your-table-component.component';
import { IsolationComponent } from './isolation/isolation.component';
import { DatePipe } from '@angular/common';
import { HospitalizationsListComponent } from './hospitalizations-list/hospitalizations-list.component';
import { DevicesPerUnitComponent } from './devices-per-unit/devices-per-unit.component';
import { MedicalDevicesComponent } from './chameleon-reports/moshe-reports/medical-devices/medical-devices.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SysAidComponent } from './sys-aid/sys-aid.component';
import { MainPageReportsComponent } from './main-page-reports/main-page-reports.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SysGraphComponent } from './sys-aid/sys-graph/sys-graph.component';
import { PermissionsDialogComponent } from './users/permissions-dialog/permissions-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AngularDualListBoxModule } from 'angular-dual-listbox';
import { ReportsPermissionsComponent } from './reports-permissions/reports-permissions.component';
import { PermissionsDialogNewComponent } from './reports-permissions/permissions-dialog-new/permissions-dialog-new.component';
import { AddReportComponent } from './reports-permissions/add-report/add-report.component';
import { UpdateReportComponent } from './reports-permissions/update-report/update-report.component';
import { CatheterComponent } from './chameleon-reports/catheter/catheter.component';
import { StazerimComponent } from './chameleon-reports/moshe-reports/stazerim/stazerim.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AddTaskDialogComponentComponent } from './admin-dashboard/add-task-dialog-component/add-task-dialog-component.component';
import { MatListModule } from '@angular/material/list';
import { Tab2Component } from './admin-dashboard/tab2/tab2.component';
import { EditTaskDialogComponent } from './admin-dashboard/edit-task-dialog/edit-task-dialog.component';
import { SysAidGraphComponent } from './admin-dashboard/sys-aid-graph/sys-aid-graph.component'; 



@NgModule({
  declarations: [
    AppComponent,
    EmpAddEditComponent,
    UsersComponent,
    HosListComponent,
    MychartComponent,
    UploadPicComponent,
    PicturesComponent,
    SQLComponent,
    FooterComponent,
    ConsiliumsComponent,
    YourTableComponentComponent,
    IsolationComponent,
    HospitalizationsListComponent,
    DevicesPerUnitComponent,
    MedicalDevicesComponent,
    SysAidComponent,
    MainPageReportsComponent,
    SysGraphComponent,
    PermissionsDialogComponent,
    ReportsPermissionsComponent,
    PermissionsDialogNewComponent,
    AddReportComponent,
    UpdateReportComponent,
    CatheterComponent,
    StazerimComponent,
    UserDashboardComponent,
    AdminDashboardComponent,
    AddTaskDialogComponentComponent,
    Tab2Component,
    EditTaskDialogComponent,
    SysAidGraphComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatSelectModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatCardModule,
    MatSidenavModule,
    FormsModule,
    MatTooltipModule,
    MatAutocompleteModule,
    MatDialogModule,
    MatCheckboxModule,
    AngularDualListBoxModule,
    MatProgressBarModule,
    MatListModule
  ],
  providers: [DatePipe],
  bootstrap: [AppComponent],
})
export class AppModule {}
