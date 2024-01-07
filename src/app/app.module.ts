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
import { UnitsComponent } from './units/units.component';
import { UsersComponent } from './users/users.component';
import { HosListComponent } from './hos-list/hos-list.component';
import { MychartComponent } from './mychart/mychart.component';
import { UploadPicComponent } from './upload-pic/upload-pic.component';
import { PicturesComponent } from './pictures/pictures.component';
import { SQLComponent } from './sql/sql.component';

import { MatCardModule } from '@angular/material/card';
import { ReportEmployeesPerSectorComponent } from './report-employees-per-sector/report-employees-per-sector.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FooterComponent } from './footer/footer.component';
import { SideBarComponent } from './side-bar/side-bar.component';
import { ConsiliumsComponent } from './consiliums/consiliums.component';
import { MatTableDataSource } from '@angular/material/table';
import { YourTableComponentComponent } from './your-table-component/your-table-component.component';

import { IsolationComponent } from './isolation/isolation.component';
import { QualityNationalComponent } from './quality-national/quality-national.component';

@NgModule({
  declarations: [
    AppComponent,
    EmpAddEditComponent,
    UnitsComponent,
    UsersComponent,
    HosListComponent,
    MychartComponent,
    UploadPicComponent,
    PicturesComponent,
    SQLComponent,
    ReportEmployeesPerSectorComponent,
    FooterComponent,
    SideBarComponent,
    ConsiliumsComponent,
    YourTableComponentComponent,
    IsolationComponent,
    QualityNationalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
