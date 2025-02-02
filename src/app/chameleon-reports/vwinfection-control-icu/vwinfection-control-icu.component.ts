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
    return this.fb.group(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = (filters['globalFilter'] || '').toLowerCase();

    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = item[column];
        const filterValue = filters[column];

        const stringValue = typeof value === 'string' ? value.toLowerCase() : String(value).toLowerCase();
        const filterString = typeof filterValue === 'string' ? filterValue.toLowerCase() : filterValue;

        return (!filterString || stringValue.includes(filterString)) &&
               (!globalFilter || this.columns.some((col) => String(item[col]).toLowerCase().includes(globalFilter)));
      })
    );

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
  }

  resetFilters() {
    this.filterForm.reset();
    this.filterForm.get('globalFilter')?.setValue('');
    this.applyFilters();
  }

  exportToExcel() {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredData);
    const workbook: XLSX.WorkBook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, 'vw_infection_control_icu.xlsx');
  }
}
