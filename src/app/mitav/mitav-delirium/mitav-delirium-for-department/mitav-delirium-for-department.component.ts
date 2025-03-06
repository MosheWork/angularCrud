import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../../environments/environment';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { MatDialog } from '@angular/material/dialog';
import { MitavGradeListDialogComponent } from '../mitav-delirium-for-department/mitav-grade-list-dialog/mitav-grade-list-dialog.component';

@Component({
  selector: 'app-mitav-delirium-for-department',
  templateUrl: './mitav-delirium-for-department.component.html',
  styleUrls: ['./mitav-delirium-for-department.component.scss'],
})
export class MitavDeliriumForDepartmentComponent implements OnInit {
  title: string = 'דו"ח דליריום למחלקה ';
  totalResults: number = 0;
  isLoading: boolean = true;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  unitOptions: string[] = [];
  loadingImages: string[] = [
    'assets/poriagood1.jfif',
    'assets/poriagood2.jfif',
    'assets/poria icon.jpg',
    'assets/poriagood3.jfif'
  ];
  currentImageIndex: number = 0;
  deliriumCount: number = 0;
  camGradeChangeCount: string = ''; 
  consiliumsOpenedCount: number = 0;
  drugForDeliriumCount: number = 0;
  preventionInterventionCount: string = ''; 
  PatientWithDeliriumCount: number = 0;


  displayedColumns: string[] = [
    'ATD_Admission_Date', 'AdmissionNo', 'AgeYears',  'TotalHospDays', 'AdmissionCAMGrade','PreventionORInterventionCAM',
    'Grade', 'GradeEntryDate', 'PatientWithDelirium', 'PatientWithDeliriumEntryDate',
    'DeliriumDaysCount',  'DrugForDelirium', 'TotalEstimationGradesCount',
    'GradeCount', 'DeliriumConsiliumsOpened', 'DeliriumConsiliumsDate', 'HoursDifference',
    'CAMGradeChanged'
  ];

  columnLabels: { [key: string]: string } = {
    ATD_Admission_Date: 'תאריך קבלה',
    AdmissionNo: 'מספר מקרה',
    AgeYears: 'גיל',
    SystemUnitName: 'מחלקה',
    TotalHospDays: 'סה"כ ימי אשפוז',
    Grade: 'ציון אומדן',
    GradeEntryDate: 'תאריך אומדן',
    PatientWithDelirium: 'דליריום',
    PatientWithDeliriumEntryDate: 'תאריך דליריום',
    DeliriumDaysCount: 'ימי דליריום',
    AdmissionCAMGrade: 'ציון CAM בקבלה',
    DrugForDelirium: 'טיפול תרופתי לדליריום',
    TotalEstimationGradesCount: 'סה"כ אומדנים',
    GradeCount: 'יחס אומדנים לימי אשפוז',
    DeliriumConsiliumsOpened: 'הזמנת ייעוץ ריפוי בעיסוק ',
    DeliriumConsiliumsDate: 'תאריך ייעוץ',
    HoursDifference: 'שעות בין דליריום ייעוץ',
    CAMGradeChanged: 'שינוי בציון CAM',
    PreventionORInterventionCAM: 'מניעה/התערבות'
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  filterForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder, public dialog: MatDialog) {
    this.filterForm = this.fb.group({
      globalFilter: [''],
      unitFilter: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListeners();
    this.startImageRotation();

    // ✅ Assign the custom filter predicate
    this.dataSource.filterPredicate = this.customFilterPredicate();
}


loadData(): void {
  this.isLoading = true;
  this.http.get<any[]>(`${environment.apiUrl}MitavDelirumForDepartment`).subscribe(
    (data) => {
      this.dataSource = new MatTableDataSource(data);
      this.calculateGradeStats();
      this.calculatePreventionInterventionStats();
      this.calculatePatientWithDeliriumStats();

      // ✅ Set custom filter predicate AFTER initializing dataSource
      this.dataSource.filterPredicate = this.customFilterPredicate();

      this.totalResults = data.length;

      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      });

      this.unitOptions = [...new Set(data.map((item) => item.SystemUnitName))].sort();
      this.isLoading = false;
    },
    (error) => {
      console.error('Error fetching data', error);
      this.isLoading = false;
    }
  );
}


  setupFilterListeners(): void {
    this.filterForm.get('globalFilter')?.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.get('unitFilter')?.valueChanges.subscribe(() => this.applyFilter());
  }
  applyFilter(): void {
    const globalFilterValue = this.filterForm.get('globalFilter')?.value?.trim().toLowerCase() || '';
    const unitFilterValue = this.filterForm.get('unitFilter')?.value || '';
  
    // ✅ Ensure filter predicate is applied before setting filter
    this.dataSource.filterPredicate = this.customFilterPredicate();
  
    // ✅ Apply filter
    this.dataSource.filter = JSON.stringify({ global: globalFilterValue, unit: unitFilterValue });
  
    // ✅ Recalculate counts after filtering
    setTimeout(() => {
      this.totalResults = this.dataSource.filteredData.length;
      this.calculateGradeStats();
      this.calculatePreventionInterventionStats();
      this.calculatePatientWithDeliriumStats();
    });
  }
  
  

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilter();
  }

  getColumnLabel(column: string): string {
    return this.columnLabels[column] || column;
  }

  exportToExcel(): void {
    const dataToExport = this.dataSource.filteredData.length ? this.dataSource.filteredData : [];
    const formattedData = dataToExport.map((item) => {
      let newItem: { [key: string]: any } = {};
      Object.keys(this.columnLabels).forEach((key) => {
        newItem[this.columnLabels[key]] = item[key] ?? '';
      });
      return newItem;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook: XLSX.WorkBook = { Sheets: { 'דו"ח דליריום': worksheet }, SheetNames: ['דו"ח דליריום'] };

    XLSX.writeFile(workbook, 'דו"ח_דליריום.xlsx');
  }

  exportToPDF(): void {
    if (!this.pdfTable || !this.pdfTable.nativeElement) {
      console.error('Error: Table reference not found!');
      return;
    }

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfContainer = document.createElement('div');
    pdfContainer.innerHTML = `<div dir="rtl" style="padding: 20px; font-size: 16px;">${this.pdfTable.nativeElement.innerHTML}</div>`;
    document.body.appendChild(pdfContainer);

    html2canvas(pdfContainer, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 20, imgWidth, imgHeight);
      pdf.save('דו"ח_דליריום.pdf');

      pdfContainer.remove();
    }).catch((error) => {
      console.error('Error generating PDF:', error);
      pdfContainer.remove();
    });
  }

  startImageRotation(): void {
    setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.loadingImages.length;
    }, 3000);
  }
  customFilterPredicate(): (data: any, filter: string) => boolean {
    return (data, filter) => {
      if (!filter) return true; // No filter, show everything
      const filterObject = JSON.parse(filter);
  
      const globalFilter = filterObject.global?.trim().toLowerCase() || '';
      const unitFilter = filterObject.unit || '';
  
      // ✅ Ensure all values are valid strings before checking
      const matchesGlobalFilter =
        !globalFilter ||
        Object.values(data).some(
          (value) =>
            value && value.toString().toLowerCase().includes(globalFilter)
        );
  
      // ✅ Ensure UnitName is valid before checking
      const matchesUnitFilter = !unitFilter || (data.SystemUnitName && data.SystemUnitName === unitFilter);
  
      return matchesGlobalFilter && matchesUnitFilter;
    };
  }
  
  
  calculateGradeStats() {
    const totalRows = this.dataSource.filteredData.length; // ✅ Use filtered data
    const validGrades = this.dataSource.filteredData.filter(row => row.Grade !== null && row.Grade !== 'לא בוצע').length;
  
    const percentage = totalRows > 0 ? ((validGrades / totalRows) * 100).toFixed(0) : '0';
  
    this.camGradeChangeCount = `${validGrades}/${totalRows} (${percentage}%)`;
  }
  
  calculatePreventionInterventionStats() {
    const totalRows = this.dataSource.filteredData.length; // ✅ Use filtered data
    const validCases = this.dataSource.filteredData.filter(row => row.PreventionORInterventionCAM !== 'לא בוצע').length;
  
    const percentage = totalRows > 0 ? ((validCases / totalRows) * 100).toFixed(0) : '0';
  
    this.preventionInterventionCount = `${validCases}/${totalRows} (${percentage}%)`;
  }
  
  calculatePatientWithDeliriumStats() {
    const validCases = this.dataSource.filteredData.filter(row => row.PatientWithDelirium === 'כן').length;
  
    this.PatientWithDeliriumCount = validCases;
  }
  highlightHoursDifference(element: any): boolean {
    if (!element.PatientWithDeliriumEntryDate || element.DeliriumConsiliumsOpened !== 'לא') {
      return false; // ✅ No highlighting if date is missing or consultation was opened
    }
  
    const deliriumEntryDate = new Date(element.PatientWithDeliriumEntryDate);
    const currentDate = new Date();
    const hoursPassed = (currentDate.getTime() - deliriumEntryDate.getTime()) / (1000 * 60 * 60); // Convert ms to hours
  
    return hoursPassed >= 72; // ✅ Return true if more than 72 hours have passed
  }
  
  openGradeListDialog(row: any): void {
    this.dialog.open(MitavGradeListDialogComponent, {
      width: '600px',
      data: {
        Admission_Medical_Record: row.Admission_Medical_Record,
        FollowUp_Medical_Record: row.FollowUp_Medical_Record,
        Release_Medical_Record: row.Release_Medical_Record
      }
    });
  }
    
}

