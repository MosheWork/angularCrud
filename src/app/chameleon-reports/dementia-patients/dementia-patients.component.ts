import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { DementiaPatientDialogComponent } from '../dementia-patients/dementia-patient-dialog/dementia-patient-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';


@Component({
  selector: 'app-dementia-patients',
  templateUrl: './dementia-patients.component.html',
  styleUrls: ['./dementia-patients.component.scss']
})
export class DementiaPatientsComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'מטופלים דימנטים ';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';    
  showOnlyThreeOrMore: boolean = false;

  displayedColumns: string[] = [
    'Admission_Date',  'UnitName', 'IdNum', 'AdmissionNo', 'FirstName', 'LastName','DataStatus','HospitalizationsLast6Months'
  ];
  
  // ✅ Columns only for the dialog
  dialogColumns: string[] = [
    'EntryDate', 'ICD9', 'DiagnosisName', 'DescriptionEntryDate','heading', 'DescriptionCognitive',
  ];
  
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalData: any[] = [];

  filterForm: FormGroup;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, public dialog: MatDialog) {
    this.filterForm = this.fb.group({
      startEntryDate: [null],  // ✅ Start empty
      endEntryDate: [null],    // ✅ Start empty
      globalFilter: ['']
    });
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;
  
    this.http.get<any[]>(`${environment.apiUrl}Dementia/DementiaPatients`)
      .subscribe(data => {
        this.originalData = data.map(item => ({
          ...item,
          EntryDate: item.EntryDate ? new Date(item.EntryDate) : null
        }));
  
        this.applyFilters(); // ✅ Apply filters to ensure data is loaded correctly
  
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
  
        this.isLoading = false;
      }, error => {
        console.error('Error fetching data', error);
        this.isLoading = false;
      });
  }
  
  applyFilters() {
    const { startEntryDate, endEntryDate, globalFilter } = this.filterForm.value;
    const startDate = startEntryDate ? new Date(startEntryDate) : null;
    const endDate = endEntryDate ? new Date(endEntryDate) : null;
  
    const filteredData = this.originalData.filter(patient => {
      const patientDate = patient.EntryDate ? new Date(patient.EntryDate) : null;
  
      const isDateInRange =
        (!startDate || (patientDate && patientDate >= startDate)) &&
        (!endDate || (patientDate && patientDate <= endDate));
  
      const isGlobalMatch = !globalFilter || Object.values(patient).some(value =>
        value?.toString().toLowerCase().includes(globalFilter.toLowerCase())
      );
  
      const hasMinHospitalizations =
        !this.showOnlyThreeOrMore || (patient.HospitalizationsLast6Months >= 3);
  
      return isDateInRange && isGlobalMatch && hasMinHospitalizations;
    });
  
    this.dataSource.data = [...filteredData];
    this.totalResults = this.dataSource.data.length;
  
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  
  
  resetFilters() {
    this.filterForm.setValue({
      startEntryDate: null,
      endEntryDate: null,
      globalFilter: ''
    });
    this.applyFilters();
  }

  exportToExcel() {
    const filteredData = this.dataSource.filteredData;
  
    if (filteredData.length === 0) {
      alert('אין נתונים לייצוא!');
      return;
    }
  
    // ✅ Define column mappings (English → Hebrew)
    const columnMappings: { [key: string]: string } = {
      //EntryDate: 'תאריך דיווח',
      UnitName: 'שם מחלקה',
     // ICD9: 'קוד ICD9',
      //DiagnosisName: 'אבחנה',
     // IdNum: 'ת.ז',
      //AdmissionNo: 'מספר אשפוז',
      FirstName: 'שם פרטי',
      LastName: 'שם משפחה',
      DataStatus: 'מקור רשומה '
    };
  
    // ✅ Convert data with Hebrew column names
    const dataForExport = filteredData.map(row => {
      const translatedRow: { [key: string]: any } = {};
      Object.keys(columnMappings).forEach(key => {
        translatedRow[columnMappings[key]] = row[key]; // Map data to Hebrew column names
      });
      return translatedRow;
    });
  
    // ✅ Create the Excel sheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'מטופלים דימנטים' : worksheet }, SheetNames: ['מטופלים דימנטים'] };
  
    // ✅ Download the file with Hebrew name
    XLSX.writeFile(workbook, 'מטופלים_דימנטים.xlsx');
  }
  openPatientDialog(patient: any): void {
    this.dialog.open(DementiaPatientDialogComponent, {
      width: '1200px',
      data: patient
    });
  }
  exportAsPDF(): void {
    if (this.dataSource.data.length === 0) {
      alert('אין נתונים להדפסה');
      return;
    }
  
    const now = new Date();
    const releaseDate = now.toLocaleDateString('he-IL');
    const releaseTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  
    const rowsPerPage = 12; // ✅ Keep 12 rows per page
    const totalPages = Math.ceil(this.dataSource.data.length / rowsPerPage);
  
    const pdf = new jsPDF({
      orientation: 'p', // Portrait mode
      unit: 'mm',
      format: 'a4'
    });
  
    for (let page = 0; page < totalPages; page++) {
      const startRow = page * rowsPerPage;
      const selectedRows = this.dataSource.data.slice(startRow, startRow + rowsPerPage);
  
      const tempTable = document.createElement('div');
      tempTable.innerHTML = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 10px; font-size: 9px; width: 100%; height: 100%;">
          <!-- Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
            <div style="text-align: right; font-size: 9px;">
              <p><strong>תאריך הפקה:</strong> ${releaseDate} ${releaseTime}</p>
            </div>
            <img src="assets/poria icon.jpg" alt="Icon" style="width: 60px; height: 35px;">
          </div>
  
          <!-- Title -->
          <h2 style="text-align: center; font-size: 12px; margin-bottom: 5px;">
            דוח מטופלים דימנטים
          </h2>
  
          <!-- Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #000;">
          <thead>
              <tr>
                <th style="padding: 8px; border: 1px solid #000; font-size: 10px;">#</th>
                <th style="padding: 8px; border: 1px solid #000; font-size: 10px;">שם מחלקה</th>
                <th style="padding: 8px; border: 1px solid #000; font-size: 10px;">שם פרטי</th>
                <th style="padding: 8px; border: 1px solid #000; font-size: 10px;">שם משפחה</th>
                <th style="padding: 8px; border: 1px solid #000; font-size: 10px;">מקור רשומה</th>
              </tr>
            </thead>
            <tbody>
              ${selectedRows
                .map(
                  (row, index) => `
                  <tr style="height: auto;">                    <td style="padding: 8px; border: 1px solid #000;">${startRow + index + 1}</td>
                    <td style="padding: 8px; border: 1px solid #000;">${row.UnitName || 'אין נתונים'}</td>
                    <td style="padding: 8px; border: 1px solid #000;">${row.FirstName || 'אין נתונים'}</td>
                    <td style="padding: 8px; border: 1px solid #000;">${row.LastName || 'אין נתונים'}</td>
                    <td style="padding: 8px; border: 1px solid #000;">${row.DataStatus || 'אין נתונים'}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
  
          <!-- Bottom Margin -->
          <div style="margin-bottom: 20px;"></div>
        </div>
      `;
  
      tempTable.style.position = 'absolute';
      tempTable.style.top = '-9999px';
      tempTable.style.width = '100%';
      tempTable.style.height = '100%';
      document.body.appendChild(tempTable);
  
      html2canvas(tempTable, {
        scale: 1, // ✅ High scale for better rendering
        height: pdf.internal.pageSize.getHeight(), // ✅ Force full page height
        width: pdf.internal.pageSize.getWidth(),
        useCORS: true,
        allowTaint: false,
      })
        .then((canvas) => {
          const imgWidth = pdf.internal.pageSize.getWidth();
          const imgHeight = pdf.internal.pageSize.getHeight(); // ✅ Ensure it takes full page height
  
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
  
          // ✅ Add a new page if there are more rows
          if (page < totalPages - 1) {
            pdf.addPage();
          }
  
          tempTable.remove();
  
          // ✅ If it's the last page, save the PDF
          if (page === totalPages - 1) {
            pdf.save('DementiaPatients_Report.pdf');
          }
        })
        .catch((error) => {
          console.error('Error rendering table to canvas:', error);
          tempTable.remove();
        });
    }
  }
  
  
  
  
  
  
  
}
