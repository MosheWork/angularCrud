import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { AngularDualListBoxModule } from 'angular-dual-listbox';
import { DatePipe } from '@angular/common';
import { NgxGaugeModule } from 'ngx-gauge';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { EmpAddEditComponent } from './emp-add-edit/emp-add-edit.component';
import { UsersComponent } from './users/users.component';
import { HosListComponent } from './old/hos-list/hos-list.component';
import { MychartComponent } from './mychart/mychart.component';
import { UploadPicComponent } from './upload-pic/upload-pic.component';
import { PicturesComponent } from './pictures/pictures.component';
import { SQLComponent } from './sql/sql.component';
import { FooterComponent } from './footer/footer.component';
import { ConsiliumsComponent } from './consiliums/consiliums.component';
import { IsolationComponent } from './isolation/isolation.component';
import { HospitalizationsListComponent } from './hospitalizations-list/hospitalizations-list.component';
import { DevicesPerUnitComponent } from './devices-per-unit/devices-per-unit.component';
import { MedicalDevicesComponent } from './chameleon-reports/moshe-reports/medical-devices/medical-devices.component';
import { SysAidComponent } from './sys-aid/sys-aid.component';
import { MainPageReportsComponent } from './main-page-reports/main-page-reports.component';
import { SysGraphComponent } from './sys-aid/sys-graph/sys-graph.component';
import { PermissionsDialogComponent } from './users/permissions-dialog/permissions-dialog.component';
import { ReportsPermissionsComponent } from './reports-permissions/reports-permissions.component';
import { PermissionsDialogNewComponent } from './reports-permissions/permissions-dialog-new/permissions-dialog-new.component';
import { AddReportComponent } from './reports-permissions/add-report/add-report.component';
import { UpdateReportComponent } from './reports-permissions/update-report/update-report.component';
import { CatheterComponent } from './chameleon-reports/catheter/catheter.component';
import { StazerimComponent } from './chameleon-reports/moshe-reports/stazerim/stazerim.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { AddTaskDialogComponentComponent } from './admin-dashboard/add-task-dialog-component/add-task-dialog-component.component';
import { Tab2Component } from './admin-dashboard/tab2/tab2.component';
import { EditTaskDialogComponent } from './admin-dashboard/edit-task-dialog/edit-task-dialog.component';
import { SysAidGraphComponent } from './admin-dashboard/sys-aid-graph/sys-aid-graph.component';
import { NewServiceCallComponent } from './serviceCalls/new-service-call/new-service-call.component';
import { MainServiceCallsScreenComponent } from './serviceCalls/main-service-calls-screen/main-service-calls-screen.component';
import { ServiceCallsScreenITComponent } from './serviceCalls/service-calls-screen-it/service-calls-screen-it.component';
import { RowEditDialogComponent } from './serviceCalls/row-edit-dialog/row-edit-dialog.component';
import { AdminHomePageComponent } from './admin-home-page/admin-home-page.component';
import { GuidesListComponent } from './Guides/guides-list/guides-list.component';
import { NewGuideFormComponent } from './Guides/new-guide-form/new-guide-form.component';
import { ViewGuideComponent } from './Guides/view-guide/view-guide.component';
import { EditGuideFormComponent } from './Guides/edit-guide-form/edit-guide-form.component';
import { HeaderComponent } from './Guides/header/header.component';
import { FooterGuideComponent } from './Guides/footer-guide/footer-guide.component';
import { ServerPingCheckAppComponent } from './server-ping-check-app/server-ping-check-app.component';
import { ManageServersComponent } from './server-ping-check-app/manage-servers/manage-servers.component';
import { AddEditServerDialogComponent } from './server-ping-check-app/add-edit-server-dialog/add-edit-server-dialog.component';
import { DepartmentLoadDashboardComponent } from './departmentLoad/department-load-dashboard/department-load-dashboard.component';
import { DepartmentDetailDialogComponent } from './departmentLoad/department-detail/department-detail.component';
import { CurrentPatientsComponent } from './departmentLoad/current-patients/current-patients.component';
import { DigitalFormComponent } from './forms/digital-form/digital-form.component';
import { EditDepartmentDialogComponent } from './departmentLoad/edit-department-dialog/edit-department-dialog.component';
import { DepartmentLoadByShiftComponent } from './departmentLoad/department-load-by-shift/department-load-by-shift.component';
import { ContactsComponent } from './contacts/contacts.component';
import { AddEditContactDialogComponent } from './contacts/add-edit-contact-dialog/add-edit-contact-dialog.component';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DynamicTablesComponent } from './chameleon-reports/dynamic-tables/dynamic-tables.component';
import { ComponentsListInUnitsComponent } from './chameleon-reports/components-list-in-units/components-list-in-units.component';
import { MedExecutionTableComponent } from './chameleon-reports/med-execution-table/med-execution-table.component';
import { ApplicationsListComponent } from './contacts/applications-list/applications-list.component';
import { AddEditApplicationDialogComponent } from './contacts/add-edit-application-dialog/add-edit-application-dialog.component';
import { ContactsDialogComponent } from './contacts/contacts-dialog/contacts-dialog.component';
import { ShiftManagementComponent } from './shift-management/shift-management/shift-management.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { BoardsComponent } from './Monday/boards/boards.component';
import { TasksComponent } from './Monday/tasks/tasks.component';
import { TaskSummaryComponent } from './Monday/task-summary/task-summary.component';
import { TaskListComponent } from './Ilana/task-list/task-list.component';
import { AddTaskComponent } from './Ilana/add-task/add-task.component';
import { EditTaskComponent } from './Ilana/edit-task/edit-task.component';
import { UploadGuideComponent } from './GuidesNew/upload-guide/upload-guide.component';
import { GuideListComponent } from './GuidesNew/guide-list/guide-list.component';
import { PalliativePatientsComponent } from './chameleon-reports/palliative-patients/palliative-patients.component';
import { SkinIntegrityReportComponent } from './chameleon-reports/skin-integrity-report/skin-integrity-report.component';
import { PatientGuidanceReportComponent } from './chameleon-reports/patient-guidance-report/patient-guidance-report.component';
import { UsersReportComponent } from './chameleon-reports/users-report/users-report.component';
import { SeniorDoctorNotSighnedComponent } from './chameleon-reports/senior-doctor-not-sighned-component/senior-doctor-not-sighned-component.component';
import { UserLogPerCaseNumberReportComponent } from './chameleon-reports/user-log-per-case-number-report/user-log-per-case-number-report.component';
import { ShiftTableComponent } from './shift-table/shift-table.component';
import { ShiftCalendarComponent } from './shift-calendar/shift-calendar.component';
import { ShiftDialogComponent } from './shift-dialog/shift-dialog.component';
import { Icd9ReportComponent } from './chameleon-reports/icd9-report/icd9-report.component';
import { SSRIProtocolComponent } from './chameleon-reports/ssriprotocol/ssriprotocol.component';
import { HemoDialysisReportComponent } from './chameleon-reports/hemo-dialysis-report/hemo-dialysis-report.component';
import { SearchByCaseNumberComponent } from './chameleon-reports/search-by-case-number/search-by-case-number.component';
import { PalliativePatientsReportComponent } from './chameleon-reports/palliative-patients-report/palliative-patients-report.component';
import { GeriatricsDrugsOnVacationComponent } from './chameleon-reports/geriatrics-drugs-on-vacation-component/geriatrics-drugs-on-vacation-component.component';
import { DrugDetailsDialogComponent } from './chameleon-reports/geriatrics-drugs-on-vacation-component/drug-details-dialog/drug-details-dialog.component';
import { DrugsReportComponent } from './chameleon-reports/drugs-report-component/drugs-report-component.component';
import { EpidemiologicalInvestigationComponent } from './chameleon-reports/epidemiological-investigation/epidemiological-investigation.component';
import { TimelineComponent } from './chameleon-reports/epidemiological-investigation/timeline/timeline.component';
import { DepartmentCapacityComponent } from './chameleonDashboard/department-capacity/department-capacity.component';
import { Drug2hReviewComponent } from './chameleon-reports/drug2h-review/drug2h-review.component';
import { Drug2hDetailsComponent } from './chameleon-reports/drug2h-review/drug2h-details/drug2h-details.component';
import { DiabetesConsultationComponent } from './chameleon-reports/diabetes-consultation/diabetes-consultation.component';
import { AwsClaudeInvocationComponent } from './aws-claude-invocation/aws-claude-invocation.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ERInfoComponent } from './chameleon-reports/erinfo/erinfo.component';
import { CommunicationTherapistComponent } from './chameleon-reports/communication-therapist/communication-therapist.component';
import { VWInfectionControlICUComponent } from './chameleon-reports/vwinfection-control-icu/vwinfection-control-icu.component';
import { DepartmentOccupiedMitavComponent } from './chameleon-reports/department-occupied-mitav/department-occupied-mitav.component';
import { MitavMobilityComponent } from './mitav/mitav-mobility/mitav-mobility.component';
import { DepartmentPercentagesDialogComponent } from './mitav/department-percentages-dialog/department-percentages-dialog.component';
import { DocumentationOfPatientMobilityDialogComponent } from './mitav/documentation-of-patient-mobility-dialog/documentation-of-patient-mobility-dialog.component';
import { CdkTableModule } from '@angular/cdk/table';
import { MitavDeliriumComponent } from './mitav/mitav-delirium/mitav-delirium.component';
import { TraumaPatientsComponent } from './chameleon-reports/trauma-patients/trauma-patients.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
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
    NewServiceCallComponent,
    MainServiceCallsScreenComponent,
    ServiceCallsScreenITComponent,
    RowEditDialogComponent,
    AdminHomePageComponent,
    GuidesListComponent,
    NewGuideFormComponent,
    ViewGuideComponent,
    EditGuideFormComponent,
    HeaderComponent,
    FooterGuideComponent,
    ServerPingCheckAppComponent,
    ManageServersComponent,
    AddEditServerDialogComponent,
    DepartmentLoadDashboardComponent,
    DepartmentDetailDialogComponent,
    CurrentPatientsComponent,
    DigitalFormComponent,
    EditDepartmentDialogComponent,
    DepartmentLoadByShiftComponent,
    ContactsComponent,
    AddEditContactDialogComponent,
    DynamicTablesComponent,
    ComponentsListInUnitsComponent,
    MedExecutionTableComponent,
    ApplicationsListComponent,
    AddEditApplicationDialogComponent,
    ContactsDialogComponent,
    ShiftManagementComponent,
    BoardsComponent,
    TasksComponent,
    TaskSummaryComponent,
    TaskListComponent,
    AddTaskComponent,
    EditTaskComponent,
    UploadGuideComponent,
    GuideListComponent,
    PalliativePatientsComponent,
    SkinIntegrityReportComponent,
    PatientGuidanceReportComponent,
    UsersReportComponent,
    SeniorDoctorNotSighnedComponent,
    UserLogPerCaseNumberReportComponent,
    ShiftTableComponent,
    ShiftCalendarComponent,
    ShiftDialogComponent,
    Icd9ReportComponent,
    SSRIProtocolComponent,
    HemoDialysisReportComponent,
    SearchByCaseNumberComponent,
    PalliativePatientsReportComponent,
    GeriatricsDrugsOnVacationComponent,
    DrugDetailsDialogComponent,
    DrugsReportComponent,
    EpidemiologicalInvestigationComponent,
    TimelineComponent,
    DepartmentCapacityComponent,
    Drug2hReviewComponent,
    Drug2hDetailsComponent,
    DiabetesConsultationComponent,
    AwsClaudeInvocationComponent,
    ERInfoComponent,
    CommunicationTherapistComponent,
    VWInfectionControlICUComponent,
    DepartmentOccupiedMitavComponent,
    MitavMobilityComponent,
    DepartmentPercentagesDialogComponent,
    DocumentationOfPatientMobilityDialogComponent,
    MitavDeliriumComponent,
    TraumaPatientsComponent,
    SpinnerComponent
  
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
    MatListModule,
    MatGridListModule,
    AngularEditorModule,
    MatProgressSpinnerModule,
    NgxGaugeModule,
    MatSlideToggleModule,
    DragDropModule,
    MatButtonToggleModule,
    CdkTableModule

  ],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
})
export class AppModule { }
