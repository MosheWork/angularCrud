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
    'personalID',
    'personalFirstName',
    'personalLastName',
    'dateOfFill',
    'diagnosticVaP',
    'diagnosticDate',
    'badNum',
    'ventilationDay',
    'mucus',
    'antibuoticTrerment',
    'wbc',
    'fever',
    'fio2',
    'peep',
    'ventilationType',
    'mucusCalture',
    'vapControl',
    'heartTritment',
    'brathFisoterapy',
    'lying30Degry',
    'stopSadation',
    'actubationChech',
    'diagnosticCLABSI',
    'cateterInsertDate1',
    'cateterPlace1',
    'cateterOutDate1',
    'cateterInsertDate2',
    'cateterPlace2',
    'cateterOutDate2',
    'preventionCLABSI',
    'infectionSigns',
    'changeBnded',
    'bandedCloresidin',
    'dryClean',
    'needlessUse',
    'chateterNeed1',
    'chateterNeed2',
    'checkWondAfterSurgery',
    'checkWondChangeBandedGood',
    'liquidQuantityAndType',
    'cultureGrowWound',
    'startAntibuticTritment',
    'startAntibuticTritmentType',
    'department'
  ];
  

  columnHeaders: { [key: string]: string } = {
    personalID: 'תעודת זהות',
    personalFirstName: 'שם פרטי',
    personalLastName: 'שם משפחה',
    dateOfFill: 'תאריך מילוי',
    diagnosticVaP: 'אבחון של VAP',
    diagnosticDate: 'תאריך אבחון',
    badNum: 'מספר מיטה',
    ventilationDay: 'יום הנשמה',
    mucus: 'כיח',
    antibuoticTrerment: 'טיפול אנטיביוטי',
    wbc: 'WBC',
    fever: 'חום',
    fio2: 'FIO2',
    peep: 'PEEP',
    ventilationType: 'דרך / סוג הנשמה',
    mucusCalture: 'לקיחת כיח לתרבית',
    vapControl: 'מניעה של VAP',
    heartTritment: 'טיפול לב',
    brathFisoterapy: 'פיזיותרפיה נשימתית',
    lying30Degry: 'השכבה 30 מעלות',
    stopSadation: 'הפסקת סדציה',
    actubationChech: 'בדיקת אפשרות לאקסטובציה',
    diagnosticCLABSI: 'אבחון CLABSI',
    cateterInsertDate1: 'תאריך הכנסת צנתר 1',
    cateterPlace1: 'מיקום צנתר 1',
    cateterOutDate1: 'תאריך הוצאת צנתר 1',
    cateterInsertDate2: 'תאריך הכנסת צנתר 2',
    cateterPlace2: 'מיקום צנתר 2',
    cateterOutDate2: 'תאריך הוצאת צנתר 2',
    preventionCLABSI: 'מניעת CLABSI',
    infectionSigns: 'סימני זיהום',
    changeBnded: 'החלפת חבישה',
    bandedCloresidin: 'חבישה עם כלורהקסידין',
    dryClean: 'רחצה יבשה',
    needlessUse: 'שימוש ב NEEDLESS',
    chateterNeed1: 'קיימת נחיצות לצנתר 1',
    chateterNeed2: 'קיימת נחיצות לצנתר 2',
    checkWondAfterSurgery: 'מעקב אחרי פצע ניתוח',
    checkWondChangeBandedGood: 'בדיקת פצע בהחלפת חבישה תקין',
    liquidQuantityAndType: 'סוג הפרשה וכמות',
    cultureGrowWound: 'צמיחה תרבית מהפצע',
    startAntibuticTritment: 'התחלת טיפול אנטיביוטי טיפולי',
    startAntibuticTritmentType: 'התחלת טיפול אנטיביוטי וסוג',
    department: 'מחלקה'
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
    this.isLoading = true;

    this.http.get<any[]>(environment.apiUrl + 'VWInfectionControlICU').subscribe({
      next: (data) => {
        this.dataSource = data;
        this.filteredData = [...data];
        this.matTableDataSource = new MatTableDataSource(this.filteredData);

        setTimeout(() => {
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort = this.sort;
        });

        this.isLoading = false;
        this.uniqueDepartments = Array.from(new Set(data.map(item => item.department))).filter(d => d);

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
      const itemDate = new Date(item.dateOfFill); // היה DateOfFill
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
    if (!departmentFilter.includes(item.department)) return false; // היה item.Department
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
