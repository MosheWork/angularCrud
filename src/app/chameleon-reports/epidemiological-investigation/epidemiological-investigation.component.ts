import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Chart, registerables } from 'chart.js';


@Component({
  selector: 'app-epidemiological-investigation',
  templateUrl: './epidemiological-investigation.component.html',
  styleUrls: ['./epidemiological-investigation.component.scss']
})
export class EpidemiologicalInvestigationComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'חקירה אפידמיולוגית';
  titleResults: string = 'סה"כ תוצאות: ';

  columns: string[] = ['MedicalRecord', 'EntryDate', 'EntryUserName', 'Heading', 'UnitName', 'Source'];
  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;

  filterForm: FormGroup;
  idNumControl: FormControl;
  timelineData: any[] = []; // Timeline data array

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
    this.idNumControl = new FormControl('');
  }

  ngOnInit() {
    this.setupFormValueChanges();
  }

  // Fetch data based on the entered Id_Num
  fetchData() {
    const idNum = this.idNumControl.value?.trim();

    if (!idNum) {
      this.snackBar.open('יש להזין מספר מזהה', 'סגור', { duration: 3000 });
      return;
    }

    // API call to fetch data
    this.http.get<any[]>(`${environment.apiUrl}EpidemiologicalInvestigation/investigate`, {
      params: { idNum }
    }).subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...this.dataSource];
      this.matTableDataSource = new MatTableDataSource(this.filteredData);
      this.matTableDataSource.paginator = this.paginator;
      this.matTableDataSource.sort = this.sort;
      this.applyFilters();
      this.totalResults = this.dataSource.length;
    }, error => {
      console.error('Error fetching data:', error);
      this.snackBar.open('שגיאה בטעינת נתונים', 'סגור', { duration: 3000 });
    });
  }

  // Create form for global filter
  createFilterForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    return this.fb.group({
      globalFilter: [''],
      startDate: [''], // Define start date filter
      endDate: [''],   // Define end date filter
    });
  }

  // Set up global filter
  setupFormValueChanges() {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.applyFilters();
        this.paginator.firstPage();
      });
  }

  // Apply global filters to the table
  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters.globalFilter || '').toLowerCase();
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;
  
    this.filteredData = this.dataSource.filter((item) => {
      // Global filter
      const globalMatch = this.columns.some((column) => {
        const value = (item[column] || '').toString().toLowerCase();
        return value.includes(globalFilter);
      });
  
      // Date filter: Check if EntryDate falls within the selected range
      let dateMatch = true;
      if (startDate || endDate) {
        const entryDate = new Date(item.EntryDate);
        if (startDate && entryDate < startDate) {
          dateMatch = false;
        }
        if (endDate && entryDate > endDate) {
          dateMatch = false;
        }
      }
  
      return (globalFilter === '' || globalMatch) && dateMatch;
    });
  
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
  }
  

  resetFilters() {
    this.filterForm.reset();
    this.idNumControl.reset();
    this.filteredData = [...this.dataSource];
    this.matTableDataSource.data = this.filteredData;
    this.totalResults = this.filteredData.length;
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'epidemiological_investigation.xlsx';
    link.click();
  }

  goToHome() {
    this.router.navigate(['/MainPageReports']);
  }

  fetchTimelineData() {
    const idNum = this.idNumControl.value?.trim();
  
    if (!idNum) {
      this.snackBar.open('יש להזין מספר מזהה', 'סגור', { duration: 3000 });
      return;
    }
  
    this.http.get<any[]>(`${environment.apiUrl}EpidemiologicalInvestigation/investigate`, {
      params: { idNum }
    }).subscribe((data) => {
      // Transform API data into timeline format
      this.timelineData = data.map((item) => ({
        timestamp: item.EntryDate, // Replace with your API's date field
        user: item.EntryUserName, // Replace with your API's user field
        details: item.Heading || 'No details available' // Replace with your API's details field
      }));
    }, error => {
      console.error('Error fetching timeline data:', error);
      this.snackBar.open('שגיאה בטעינת נתונים', 'סגור', { duration: 3000 });
    });
  }
  
  
  createTimelineChart() {
    const ctx = document.getElementById('timelineChart') as HTMLCanvasElement;
  
    // Use the transformed timelineData
    const labels = this.timelineData.map((item) => item.timestamp);
    const data = this.timelineData.map((item) => item.user);
  
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'User Activity Over Time',
            data,
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.3)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Timestamp',
            },
          },
          y: {
            title: {
              display: true,
              text: 'User',
            },
          },
        },
      },
    });
  }
  
  
  onTabChange(index: number) {
    if (index === 1) { // Timeline tab index
      this.fetchTimelineData();
    }
  }
}
