import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-vw-infection-control-icu',
  templateUrl: './vwinfection-control-icu.component.html',
  styleUrls: ['./vwinfection-control-icu.component.scss']
})
export class VWInfectionControlICUComponent implements OnInit {
  totalResults: number = 0;
  titleUnit: string = 'דוח זיהומים טיפול נמרץ';
  Title1: string = ' סה"כ תוצאות: ';
  Title2: string = '';
  uniqueDepartments: string[] = [];
  isLoading:boolean=true;

  // Updated columns list based on the new SQL View
  columns: string[] = [
    'PersonalID',
    'PersonalFirstName',
    'PersonalLastName',
    'DateOfFill',
    'DiagnosticVaP',
    'DiagnosticDate',
    'BadNum',
    'VentilationDay',
    'Mucus',
    'AntibuoticTrerment',
    'WBC',
    'Fever',
    'FIO2',
    'PEEP',
    'VentilationType',
    'MucusCalture',
    'VapControl',
    'HeartTritment',
    'BrathFisoterapy',
    'Lying30Degry',
    'StopSadation',
    'ActubationChech',
    'DiagnosticCLABSI',
    'CateterInsertDate1',
    'CateterPlace1',
    'CateterOutDate1',
    'CateterInsertDate2',
    'CateterPlace2',
    'CateterOutDate2',
    'PreventionCLABSI',
    'InfectionSigns',
    'ChangeBnded',
    'BandedCloresidin',
    'DryClean',
    'NEEDLESSUse',
    'ChateterNeed1',
    'ChateterNeed2',
    'CheckWondAfterSurgery',
    'CheckWondChangeBandedGood',
    'LiquidQuantityAndType',
    'CultureGrowWound',
    'StartAntibuticTritment',
    'StartAntibuticTritmentType',
    'Department'
  ];

  columnHeaders: { [key: string]: string } = {
    PersonalID: 'תעודת זהות',
    PersonalFirstName: 'שם פרטי',
    PersonalLastName: 'שם משפחה',
    DateOfFill: 'תאריך מילוי',
    DiagnosticVaP: 'אבחון של VAP',
    DiagnosticDate: 'תאריך אבחון',
    BadNum: 'מספר מיטה',
    VentilationDay: 'יום הנשמה',
    Mucus: 'כיח',
    AntibuoticTrerment: 'טיפול אנטיביוטי',
    WBC: 'WBC',
    Fever: 'חום',
    FIO2: 'FIO2',
    PEEP: 'PEEP',
    VentilationType: 'דרך / סוג הנשמה',
    MucusCalture: 'לקיחת כיח לתרבית',
    VapControl: 'מניעה של VAP',
    HeartTritment: 'טיפול לב',
    BrathFisoterapy: 'פיזיותרפיה נשימתית',
    Lying30Degry: 'השכבה 30 מעלות',
    StopSadation: 'הפסקת סדציה',
    ActubationChech: 'בדיקת אפשרות לאקסטובציה',
    DiagnosticCLABSI: 'אבחון CLABSI',
    CateterInsertDate1: 'תאריך הכנסת צנתר 1',
    CateterPlace1: 'מיקום צנתר 1',
    CateterOutDate1: 'תאריך הוצאת צנתר 1',
    CateterInsertDate2: 'תאריך הכנסת צנתר 2',
    CateterPlace2: 'מיקום צנתר 2',
    CateterOutDate2: 'תאריך הוצאת צנתר 2',
    PreventionCLABSI: 'מניעת CLABSI',
    InfectionSigns: 'סימני זיהום',
    ChangeBnded: 'החלפת חבישה',
    BandedCloresidin: 'חבישה עם כלורהקסידין',
    DryClean: 'רחצה יבשה',
    NEEDLESSUse: 'שימוש ב NEEDLESS',
    ChateterNeed1: 'קיימת נחיצות לצנתר 1',
    ChateterNeed2: 'קיימת נחיצות לצנתר 2',
    CheckWondAfterSurgery: 'מעקב אחרי פצע ניתוח',
    CheckWondChangeBandedGood: 'בדיקת פצע בהחלפת חבישה תקין',
    LiquidQuantityAndType: 'סוג הפרשה וכמות',
    CultureGrowWound: 'צמיחה תרבית מהפצע',
    StartAntibuticTritment: 'התחלת טיפול אנטיביוטי טיפולי',
    StartAntibuticTritmentType: 'התחלת טיפול אנטיביוטי וסוג',
    Department: 'מחלקה'
  };

  dataSource: any[] = [];
  filteredData: any[] = [];
  matTableDataSource: MatTableDataSource<any>;
  loading: boolean = true;

  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.createFilterForm();
    this.matTableDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit() {
    this.loading = true;

    this.http.get<any[]>(environment.apiUrl + 'VWInfectionControlICU').subscribe({
      next: (data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);

        setTimeout(() => {
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort = this.sort;
        });

        this.loading = false;
        this.uniqueDepartments = Array.from(new Set(data.map(item => item.Department))).filter(d => d);

        this.columns.forEach((column) => {
          this.filterForm.get(column)?.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(() => this.applyFilters());
        });

        this.filterForm.valueChanges.subscribe(() => {
          this.applyFilters();
          this.paginator.firstPage();
        });

        this.applyFilters();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.loading = false;
      }
    });
  }

  private createFilterForm(): FormGroup {
    const formControls: any = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl('');
    formControls['startDate'] = new FormControl(null);  // ✅ Start Date
    formControls['endDate'] = new FormControl(null);    // ✅ End Date
    formControls['DepartmentFilter'] = new FormControl([]);

    return this.fb.group(formControls);
  }
  applyFilters() {
    const filters = this.filterForm.value;
    const startDate = filters['startDate'] ? new Date(filters['startDate']) : null;
    const endDate = filters['endDate'] ? new Date(filters['endDate']) : null;
    const globalFilter = filters['globalFilter'] ? filters['globalFilter'].toLowerCase() : '';
  
    this.filteredData = this.dataSource.filter(item => {
      const itemDate = new Date(item.DateOfFill);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
      const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;
      const departmentFilter = filters['DepartmentFilter'];

      // Filter by date range
      if (startDateOnly && itemDateOnly < startDateOnly) return false;
      if (endDateOnly && itemDateOnly > endDateOnly) return false;
  
      // Filter by global text search
      if (globalFilter) {
        const found = this.columns.some(column => {
          const value = item[column] ? item[column].toString().toLowerCase() : '';
          return value.includes(globalFilter);
        });
        if (!found) return false;
      }
   // Department multi-select filter
   if (departmentFilter && departmentFilter.length > 0) {
    if (!departmentFilter.includes(item.Department)) return false;
  }

      // Filter by individual columns
      for (const column of this.columns) {
        const columnFilter = filters[column];
        if (columnFilter) {
          const itemValue = item[column] ? item[column].toString().toLowerCase() : '';
          if (!itemValue.includes(columnFilter.toLowerCase())) {
            return false;
          }
        }
      }
  
      return true;
    });
  
    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }
  
  
  

  resetFilters() {
    this.filterForm.reset();  // ✅ Reset all filters
    this.filterForm.get('globalFilter')?.setValue('');
    this.filterForm.get('startDate')?.setValue(null);  // ✅ Reset Start Date
    this.filterForm.get('endDate')?.setValue(null);    // ✅ Reset End Date
    this.filterForm.get('DepartmentFilter')?.setValue([]);

    this.applyFilters();  // ✅ Reapply the filters
  }
  
  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, 'vw_infection_control_icu.xlsx');
  }
}
