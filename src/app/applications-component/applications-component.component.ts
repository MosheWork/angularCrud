import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-applications',
  templateUrl: './applications-component.component.html',
  styleUrls: ['./applications-component.component.scss']
})
export class ApplicationsComponent implements OnInit {
  totalResults: number = 0;
  displayedColumns: string[] = ['AppName', 'Link', 'Comments', 'Active', 'Actions'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  originalData: any[] = [];
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.isLoading = true;

    this.http.get<any[]>(`${environment.apiUrl}Applications/GetApplications`)
      .subscribe(data => {
        this.originalData = data;
        this.dataSource.data = [...this.originalData];
        this.totalResults = this.dataSource.data.length;

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

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
    this.totalResults = this.dataSource.filteredData.length;
  }

  resetFilters() {
    this.dataSource.filter = '';
    this.totalResults = this.dataSource.data.length;
  }

  exportToExcel() {
    if (this.dataSource.filteredData.length === 0) {
      alert('אין נתונים לייצוא!');
      return;
    }

    const dataForExport = this.dataSource.filteredData.map(row => ({
      'שם אפליקציה': row.AppName,
      'קישור': row.Link,
      'הערות': row.Comments,
      'פעיל': row.Active === true || row.Active === 1 ? 'כן' : 'לא'
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook: XLSX.WorkBook = { Sheets: { 'אפליקציות' : worksheet }, SheetNames: ['אפליקציות'] };

    XLSX.writeFile(workbook, 'Applications.xlsx');
  }

  addRow() {
    this.dataSource.data = [
      {
        ID: 0,
        AppName: '',
        Link: '',
        Comments: '',
        Active: 1,
        isNew: true
      },
      ...this.dataSource.data
    ];
  }
  
  saveRow(element: any) {
    const payload = {
      ID: 0,  // Will insert new row because ID=0
      AppName: element.AppName,
      Link: element.Link,
      Comments: element.Comments,
      Active: 1
    };
  
    this.http.post(`${environment.apiUrl}Applications/UpsertApplication`, payload)
      .subscribe({
        next: () => {
          alert('ההוספה בוצעה בהצלחה!');
          this.fetchData(); // Refresh data
        },
        error: (error) => {
          console.error('Error saving application', error);
          alert('שגיאה בשמירת האפליקציה');
        }
      });
  }
  editRow(element: any) {
    // Optional: make sure only one row is editing
    this.dataSource.data.forEach(row => row.isEditing = false);
    element.isEditing = true;
  }
  
  saveEdit(element: any) {
    const payload = {
      ID: element.ID,
      AppName: element.AppName,
      Link: element.Link,
      Comments: element.Comments,
      Active: element.Active ? 1 : 0
    };
  
    this.http.post(`${environment.apiUrl}Applications/UpsertApplication`, payload)
      .subscribe({
        next: () => {
          alert('עודכן בהצלחה');
          element.isEditing = false;
          this.fetchData(); // Refresh from DB to ensure consistency
        },
        error: () => {
          alert('שגיאה בעדכון');
        }
      });
  }
  
}
