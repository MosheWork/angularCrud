import { Component, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as XLSX from 'xlsx';

interface MedExecutionModel {
  Basic_Name: string;
  Drug: string;
  Exec_Status: number;
  Exec_Status_Name: string;
  Execution_Date: Date;
  Category_Name: string;
  Execution_UnitName: string;
  Admission_No: string;
  Generic_Name_ForDisplay: string;
  Dosage_InOrder: number;
  Dosage_Unit_InOrder: string;
  Way_Of_Giving: string;
  Id_Num: string;
  Full_Name: string;
  Depart_Name: string;
  Unit_Satellite_Name: string; // Add this property
}
interface AggregatedMedExecutionModel {
  Unit_Satellite_Name: string;
  Generic_Name_ForDisplay: string;
  Way_Of_Giving: string;
  Dosage_Unit_InOrder: string;
  Dosage_InOrder: number;
  Count_Dosage_InOrder: number;
  Sum_Dosage_InOrder2: number;
}

@Component({
  selector: 'app-med-execution-table',
  templateUrl: './med-execution-table.component.html',
  styleUrls: ['./med-execution-table.component.scss'],
  providers: [DatePipe]
})
export class MedExecutionTableComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'Basic_Name',
    'Drug',
    'Execution_Date',
    'Category_Name',
    'Execution_UnitName',
    'Generic_Name_ForDisplay',
    'Dosage_InOrder',
    'Dosage_Unit_InOrder',
    'Way_Of_Giving',
    'Id_Num',
    'Full_Name',
    'Unit_Satellite_Name'
  ];
  unitSatelliteNameOptions: string[] = [
    'קבלה לחדר ניתוח כללי',
    'אולטראסאונד למיילדות וגניקולוגיה',
    'אשפוז יום אונקולוגי',
    'אשפוז יום גינקו-אונקולוגי',
    'אשפוז יום המטולוגי',
    'אשפוז יום כאב',
    'אשפוז יום ראומטולוגי',
    'אשפוז יום שיקומי מבוגרים',
    'בדיקה חדשה 123',
    'גסטרואנטולוגיה - מכון',
    'היחידה לדיאליזה פריטוניאלית',
    'היחידה לרפואת הפה',
    'המחלקה לגריאטריה שיקומית',
    'המחלקה לרפואת האם והעובר',
    'השירות לשיחזורים מיקרוכירורגית',
    'התאוששות ח.נ אמבולטורי',
    'התאוששות ח.נ חדר לידה',
    'התאוששות ח.נ כללי',
    'התאוששות ח.נ פה ולסת',
    'התאוששות חדר ניתוח',
    'חדר לידה',
    'חדר ניתוח',
    'חדר ניתוח אמבולטורי',
    'חדר ניתוח חדר לידה',
    'חדר ניתוח כללי',
    'חדר ניתוח פה ולסת',
    'טיפול נמרץ בפג ובילוד',
    'טיפול נמרץ כירורגית חזה',
    'טיפול נמרץ כירורגית כלי דם',
    'טיפול נמרץ כירורגית לב',
    'טיפול נמרץ כללי',
    'טיפול נמרץ כללי.',
    'טיפול נמרץ לב',
    'טיפול נמרץ נשימתי',
    'יומנים לא פעילים',
    'ילדים',
    'כירורגית חזה',
    'כירורגית כלי דם',
    'כירורגית לב',
    'מודולים סופיים לפריסה',
    'מחלקה אונקולוגית',
    'מחלקה גנרית פנימית - לא פעילה',
    'מחלקה גנרית פנימית מנהלת פוריה',
    'מחלקה גנרית פנימית מנהלת פוריה- חדש',
    'מחלקה גריאטרית',
    'מחלקה כירורגית',
    'מחלקה לרפואה דחופה',
    'מחלקה נוירולוגית ',
    'מחלקה פסיכיאטרית',
    'מחלקת אורולוגיה',
    'מחלקת אורתופדיה',
    'מחלקת אף אוזן גרון',
    'מחלקת בדיקות',
    'מחלקת הדרכות',
    'מחלקת הריון בסיכון',
    'מחלקת יולדות',
    'מחלקת ילדים',
    'מחלקת ילודים',
    'מחלקת כירורגיה',
    'מחלקת כירורגית ילדים',
    'מחלקת נוירולוגיה ושבץ מוחי',
    'מחלקת נשים',
    'מחלקת עיניים',
    'מחלקת פה ולסת',
    'מחלקת פנימית א',
    'מחלקת פנימית ב',
    'מחלקת צנתרים',
    'מחלקת קרדיולוגיה',
    'מחלקת שיקום אורטופדי',
    'מחלקת שיקום ילדים',
    'מחלקת שיקום כללי',
    'מיון ילדים',
    'מיון מיילדותי',
    'מכון אונקולוגי',
    'מכון גסטרואנטורולוגיה',
    'מכון דיאליזה',
    'מכון המודיאליזה',
    'מכון נוירולוגיה',
    'מכון ריאות',
    'מרפאה אונקולוגית/ המטואונקולגית',
    'מרפאה אורולוגית',
    'מרפאה אורתופדית',
    'מרפאה אנדוקרינולוגית',
    'מרפאה אנדוקרינולוגית ילדים',
    'מרפאה אף אוזן גרון',
    'מרפאה גנרית פנימית מנהלת פוריה',
    'מרפאה המטולוגית',
    'מרפאה כירורגית א',
    'מרפאה נשים',
    'מרפאה פנימית מנהלת פוריה',
    'מרפאה ראומטולוגית',
    'מרפאת אורתופדית כף יד',
    'מרפאת אורתופדית משתחררים',
    'מרפאת אורתופדית פרקי ירך וברך',
    'מרפאת אי ספיקה',
    'מרפאת אקו לב',
    'מרפאת בלוטות רוק',
    'מרפאת גסטרו ילדים',
    'מרפאת דיאליזה צפקית',
    'מרפאת כאב',
    'מרפאת כירורגית פה ולסת',
    'מרפאת מפרקי לסתות',
    'מרפאת סוכרת הריון',
    'מרפאת עיניים',
    'מרפאת פה ולסת',
    'מרפאת ציטוטק',
    'מרפאת ריאות',
    'פנימית - מחלקה ראשונה פוריה',
    'פנימית - מנהלת',
    'צנתורי מח',
    'קבלה חדר ניתוח פה ולסת',
    'קבלה לחדר ניתוח',
    'קבלה לחדר ניתוח אמבולטורי',
    'קבלה לחדר ניתוח חדרי לידה',
    'קרדיולוגיה פולשנית',
    'רדיולוגיה פולשנית'
  ];
  originalData: MedExecutionModel[] = []; // Add this property
  aggregatedDataSource = new MatTableDataSource<AggregatedMedExecutionModel>();

  dataSource = new MatTableDataSource<MedExecutionModel>();
  searchValue: string = '';
  titleUnit: string = 'בית מרקחת ';
  Title1: string = '   דוח תרופות - ';
  Title2: string = 'סה"כ תוצאות ';
  totalResults: number = 0;
  filterForm: FormGroup;
  showGraph: boolean = false;
  loading: boolean = false;
  showSuccessMessage: boolean = false;
  showMessage: boolean = false;
  basicNameOptions: string[] = [];
  genericNameOptions: string[] = [];
  unitNameOptions: string[] = [];
  filteredBasicNameOptions!: Observable<string[]>;
  filteredGenericNameOptions!: Observable<string[]>;
  filteredUnitNameOptions: string[] = [];
  unitNameFilter: string = '';
  unitSatelliteNamesControl = new FormControl<string[]>([]); // Form control for Unit_Satellite_Name


aggregatedDisplayedColumns: string[] = [
  'Unit_Satellite_Name',
  'Generic_Name_ForDisplay',
  'Way_Of_Giving',
  'Dosage_Unit_InOrder',
  'Dosage_InOrder',
  'Count_Dosage_InOrder',
  'Sum_Dosage_InOrder2'
];
@ViewChild('aggregatedPaginator') aggregatedPaginator!: MatPaginator;
@ViewChild('aggregatedSort') aggregatedSort!: MatSort;
  // Add this to the `createFilterForm` method:
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  aggregatedData: AggregatedMedExecutionModel[] = []; // ✅ Ensure correct type
  
  basicNamesControl = new FormControl('');
  genericNamesControl = new FormControl('');
  unitNamesControl = new FormControl<string[]>([]);

  constructor(private http: HttpClient, private fb: FormBuilder, private datePipe: DatePipe) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    this.fetchBasicNameOptions();
    this.fetchGenericNameOptions();
    this.fetchUnitNameOptions();
  
 // 🔹 Apply Filtering when Unit Satellite Names change
 this.unitSatelliteNamesControl.valueChanges.subscribe((selectedUnits: string[] | null) => {
  this.filterUnitSatelliteNames(selectedUnits || []);
});
    this.filteredBasicNameOptions = this.basicNamesControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterBasicNameOptions(value || ''))
    );
  
    this.filteredGenericNameOptions = this.genericNamesControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterGenericNameOptions(value || ''))
    );
  }
  

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  
    this.aggregatedDataSource.paginator = this.aggregatedPaginator;
    this.aggregatedDataSource.sort = this.aggregatedSort;
  }
  
  fetchBasicNameOptions() {
    this.http.get<string[]>(`${environment.apiUrl}MedExecutionAPI/GetBasicNameOptions`).subscribe(
      data => {
        this.basicNameOptions = data;
      },
      error => {
        console.error('Error fetching basic name options:', error);
      }
    );
  }
  fetchUnitSatelliteNameOptions() {
    this.http.get<string[]>(`${environment.apiUrl}MedExecutionAPI/GetUnitSatelliteNameOptions`).subscribe(
      data => {
        this.unitSatelliteNameOptions = data;
      },
      error => {
        console.error('Error fetching unit satellite name options:', error);
      }
    );
  }
  
  
  fetchGenericNameOptions() {
    this.http.get<string[]>(`${environment.apiUrl}MedExecutionAPI/GetGenericNameOptions`).subscribe(
      data => {
        this.genericNameOptions = data;
      },
      error => {
        console.error('Error fetching generic name options:', error);
      }
    );
  }

  fetchUnitNameOptions() {
    this.http.get<string[]>(`${environment.apiUrl}MedExecutionAPI/GetUnitNameOptions`).subscribe(
      data => {
        this.unitNameOptions = data;
        this.filteredUnitNameOptions = data; // Initialize filtered options
      },
      error => {
        console.error('Error fetching unit name options:', error);
      }
    );
  }

  private _filterBasicNameOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.basicNameOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterGenericNameOptions(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.genericNameOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  filterUnitNames() {
    const filterValue = this.unitNameFilter.toLowerCase();
    this.filteredUnitNameOptions = this.unitNameOptions.filter(option =>
      option.toLowerCase().includes(filterValue)
    );
    console.log('Filter value:', filterValue);
    console.log('Filtered options:', this.filteredUnitNameOptions);
  }
  

  displayBasicName(basicName: string): string {
    return basicName;
  }

  displayGenericName(genericName: string): string {
    return genericName;
  }

  displayUnitName(unitName: string): string {
    return unitName;
  }

  search() {
    this.loadData();
  }
  loadData() {
    this.loading = true;
    this.showSuccessMessage = false;
  
    const filters = this.filterForm.value;
    let params = new HttpParams();
  
    if (filters.StartDate) {
      const formattedStartDate = this.datePipe.transform(filters.StartDate, 'yyyy-MM-dd');
      params = params.append('startDate', formattedStartDate!);
    }
  
    if (filters.EndDate) {
      const formattedEndDate = this.datePipe.transform(filters.EndDate, 'yyyy-MM-dd');
      params = params.append('endDate', formattedEndDate!);
    }
  
    if (filters.Basic_Names) {
      params = params.append('basic_Names', filters.Basic_Names);
    }
  
    if (filters.Category_Name) {
      params = params.append('category_Name', filters.Category_Name);
    }
  
    if (filters.Generic_Names_ForDisplay) {
      params = params.append('generic_Names_ForDisplay', filters.Generic_Names_ForDisplay);
    }
  
    if (filters.Drug) {
      params = params.append('drug', filters.Drug);
    }
  
    // 🔹 Fetch data for Main Table
    this.http.get<MedExecutionModel[]>(`${environment.apiUrl}MedExecutionAPI`, { params }).subscribe(
      data => {
        this.originalData = data;
        this.dataSource.data = [...data];
        this.totalResults = data.length;
        this.loading = false;
    
        // ✅ Extract unique Unit_Satellite_Name values
        const uniqueUnitNames = [...new Set(data.map(item => item.Unit_Satellite_Name).filter(Boolean))];
        this.unitSatelliteNameOptions = uniqueUnitNames.sort();
      },
      error => {
        console.error('Error loading data:', error);
        this.loading = false;
      }
    );
    
  
    // 🔹 Fetch data for Aggregated Table
    this.http.get<AggregatedMedExecutionModel[]>(`${environment.apiUrl}MedExecutionAPI/GetAggregatedData`, { params }).subscribe(
      data => {
      // after the GET to GetAggregatedData
this.aggregatedData = data.map((item: any) => ({
  Unit_Satellite_Name: item.Unit_Satellite_Name ?? item.unit_Satellite_Name,
  Generic_Name_ForDisplay: item.Generic_Name_ForDisplay ?? item.generic_Name_ForDisplay,
  Way_Of_Giving: item.Way_Of_Giving ?? item.way_Of_Giving,
  Dosage_Unit_InOrder: item.Dosage_Unit_InOrder ?? item.dosage_Unit_InOrder,
  Dosage_InOrder: item.Dosage_InOrder ?? item.dosage_InOrder,
  Count_Dosage_InOrder: item.Count_Dosage_InOrder ?? item.count_Dosage_InOrder,
  Sum_Dosage_InOrder2: item.Sum_Dosage_InOrder2 ?? item.sum_Dosage_InOrder2,
}));
this.aggregatedDataSource.data = [...this.aggregatedData];

      },
      error => {
        console.error('Error loading aggregated data:', error);
      }
    );
    
  }
  
  
  
  
  
  
  applyFilters() {
    
  }
  
  

  createFilterForm(): FormGroup {
    return this.fb.group({
      Basic_Names: this.basicNamesControl,
      Drug: new FormControl(''),
      Execution_Date: new FormControl(''),
      Category_Name: new FormControl(''),
      Execution_UnitNames: this.unitNamesControl,
      Unit_SatelliteNames: this.unitSatelliteNamesControl, // Include the control here
      Admission_No: new FormControl(''),
      Generic_Names_ForDisplay: this.genericNamesControl,
      StartDate: new FormControl(''),
      EndDate: new FormControl(''),
    });
  }
  

  getFormControl(column: string): FormControl {
    return this.filterForm.get(column) as FormControl;
  }

  getColumnLabel(column: string): string {
    const columnLabels: Record<string, string> = {
      Basic_Name: 'Basic Name',
      Drug: 'Drug',
      Execution_Date: 'Execution Date',
      Category_Name: 'Category Name',
      Execution_UnitName: 'Execution Unit Name',
      Admission_No: 'Admission No',
      Generic_Name_ForDisplay: 'Generic Name'
    };
    return columnLabels[column] || column;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
  }

  exportToExcel() {
    const data = this.dataSource.data.map(item => {
      const record: any = {};
      this.displayedColumns.forEach(column => record[column] = item[column as keyof MedExecutionModel]);
      return record;
    });
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MedExecutionData.xlsx';
    link.click();
  }

  exportToExcel2() {
    const exportData = this.aggregatedDataSource.data.map(item => ({
      'Unit Satellite Name': item.Unit_Satellite_Name,
      'Generic Name For Display': item.Generic_Name_ForDisplay,
      'Way Of Giving': item.Way_Of_Giving,
      'Dosage Unit In Order': item.Dosage_Unit_InOrder,
      'Dosage In Order': item.Dosage_InOrder,
      'Count of Dosage In Order': item.Count_Dosage_InOrder, // ✅ Ensure correct mapping
      'Total Dosage Sum': item.Sum_Dosage_InOrder2
    }));
  
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Aggregated Data': worksheet },
      SheetNames: ['Aggregated Data'],
    };
  
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Aggregated_Med_Execution_Data.xlsx';
    link.click();
  }
  
  
  


  navigateToGraphPage() {
    this.showGraph = !this.showGraph;
  }

  goToHome() {
    // Implement navigation to the home page
  }

  applyFilter(event: Event, column: string) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterForm.get(column)?.setValue(filterValue.trim().toLowerCase());
  }

  @HostListener('mouseenter', ['$event'])
  onMouseEnter() {
    this.showMessage = true;
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave() {
    this.showMessage = false;
  }

  filterUnitSatelliteNames(selectedUnitSatelliteNames: string[]): void {
    if (selectedUnitSatelliteNames.length > 0) {
      // 🔹 Filter Main Table
      this.dataSource.data = this.originalData.filter(item =>
        selectedUnitSatelliteNames.includes(item.Unit_Satellite_Name)
      );
  
      // 🔹 Filter Aggregated Table
      this.aggregatedDataSource.data = this.aggregatedData.filter(item =>
        selectedUnitSatelliteNames.includes(item.Unit_Satellite_Name)
      );
    } else {
      // 🔹 Restore Original Data in Both Tables
      this.dataSource.data = [...this.originalData];
      this.aggregatedDataSource.data = [...this.aggregatedData];
    }
  
    // Update total results count
    this.totalResults = this.dataSource.data.length;
  }
  
  
  
  
  
  
  
  resetUnitSatelliteFilter(): void {
    this.unitSatelliteNamesControl.setValue([]);
  
    // Restore original data in both tables
    this.dataSource.data = [...this.originalData];
    this.aggregatedDataSource.data = [...this.aggregatedData];
  
    // Update total results count
    this.totalResults = this.dataSource.data.length;
  }
  
  
}
