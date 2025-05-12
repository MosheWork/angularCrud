import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-measurement-data-moshe',
  templateUrl: './measurement-data-moshe.component.html',
  styleUrls: ['./measurement-data-moshe.component.scss'],
})
export class MeasurementDataMosheComponent implements OnInit {
  title: string = 'דו"ח מדידות - משה';
  totalResults: number = 0;
  isLoading: boolean = true;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  unitOptions: string[] = [];
  measurmentIdOptions: string[] = [];
  gaugeYear = 0;
  gaugeQuarter = 0;
  gaugeMonth = 0;
  
  moneYear = 0;
  mechaneYear = 0;
  moneQuarter = 0;
  mechaneQuarter = 0;
  moneMonth = 0;
  mechaneMonth = 0;
  
  camAssessmentGauge: number = 0;
  validCAMCount: number = 0;
  invalidCAMCount: number = 0;
  totalCAMCases: number = 0;
  yearOptions: number[] = [];
quarterOptions: number[] = [1, 2, 3, 4]; // fixed
monthOptions: number[] = [];
measurementList: { id: string, desc: string }[] = [];

  moneSum: number = 0;
  mechaneSum: number = 0;
  moneToMechaneGauge: number = 0;
  measurementDescMap: { [id: string]: string } = {};
  measurementSummary: any[] = [];
  departmentDetailsMap: { [id: string]: any[] } = {};
  expandedElement: string | null = null;
  

  displayedColumns: string[] = [
    'Measurment_ID', 'Case_Number', 'Date', 'Mone', 'Mechane', 'Department'
  ];

  columnLabels: { [key: string]: string } = {
    Measurment_ID: 'מספר מדידה',
    Case_Number: 'מספר מקרה',
    Date: 'תאריך',
    Mone: 'מונה',
    Mechane: 'מכנה',
    Department: 'מחלקה'
  };

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('pdfTable', { static: false }) pdfTable!: ElementRef;

  filterForm: FormGroup;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      globalFilter: [''],
      unitFilter: [''],
      measurmentIdFilter: [''],
      yearFilter: [''],
      quarterFilter: [''],
      monthFilter: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.setupFilterListeners();
    this.loadMeasurements();
    this.loadMeasurementSummaries(); // ✅ NEW FUNCTION


  }

  loadData(): void {
    this.isLoading = true;
    this.http.get<any[]>(`${environment.apiUrl}MeasurementDataMoshe`).subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.totalResults = data.length;

        this.unitOptions = [...new Set(data.map((item) => item.Department))].sort();
        this.measurmentIdOptions = [...new Set(data.map((item) => item.Measurment_ID))].sort();
        const dates = data.map(item => new Date(item.Date)).filter(d => !isNaN(d.getTime()));

this.yearOptions = [...new Set(dates.map(d => d.getFullYear()))].sort((a, b) => b - a);
this.monthOptions = [...new Set(dates.map(d => d.getMonth() + 1))].sort((a, b) => a - b);

        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });
        this.isLoading = false;
        this.calculateMoneToMechaneGauge();
        this.calculateAllGauges();  // << Add this to initialize values

      },
      (error) => {
        console.error('Error fetching data', error);
        this.isLoading = false;

      }
    );
  }
  loadMeasurements(): void {
    this.http.get<any[]>(`${environment.apiUrl}MeasurementDataMoshe/GetMeasurements`).subscribe(
      (data) => {
        this.measurementDescMap = data.reduce((acc, curr) => {
          acc[curr.MeasurementCode] = curr.MeasurementShortDesc; // ✅ match on MeasurementCode!
          return acc;
        }, {} as { [code: string]: string });
      }
    );
  }
  loadMeasurementSummaries(): void {
    this.isLoading = true;
  
    this.http.get<any[]>(`${environment.apiUrl}MeasurementDataMoshe/SummaryByMeasurement`).subscribe(summary => {
      this.measurementSummary = summary;
  
      this.http.get<any[]>(`${environment.apiUrl}MeasurementDataMoshe/SummaryByDepartment`).subscribe(details => {
        this.departmentDetailsMap = details.reduce((acc, item) => {
          if (!acc[item.MeasurementCode]) acc[item.MeasurementCode] = [];
          acc[item.MeasurementCode].push(item);
          return acc;
        }, {});
        
        this.isLoading = false;
      }, err => {
        console.error('Error loading department details', err);
        this.isLoading = false;
      });
  
    }, err => {
      console.error('Error loading measurement summary', err);
      this.isLoading = false;
    });
  }
  
  setupFilterListeners(): void {
    this.filterForm.get('globalFilter')?.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.get('unitFilter')?.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.get('measurmentIdFilter')?.valueChanges.subscribe(() => this.applyFilter());
    this.filterForm.get('yearFilter')?.valueChanges.subscribe(() => this.applyFilter());
this.filterForm.get('quarterFilter')?.valueChanges.subscribe(() => this.applyFilter());
this.filterForm.get('monthFilter')?.valueChanges.subscribe(() => this.applyFilter());

  }

  applyFilter(): void {
    const globalFilterValue = this.filterForm.get('globalFilter')?.value?.trim().toLowerCase() || '';
    const unitFilterValue = this.filterForm.get('unitFilter')?.value || '';
    const measurmentIdFilterValue = this.filterForm.get('measurmentIdFilter')?.value || '';
    const yearFilter = +this.filterForm.get('yearFilter')?.value || null;
    const quarterFilter = +this.filterForm.get('quarterFilter')?.value || null;
    const monthFilter = +this.filterForm.get('monthFilter')?.value || null;
  
    this.dataSource.filterPredicate = (data, filter) => {
      const filterObject = JSON.parse(filter);
  
      const matchesGlobalFilter = !filterObject.global || Object.values(data).some(
        (value) => value && value.toString().toLowerCase().includes(filterObject.global)
      );
  
      const matchesUnitFilter = !filterObject.unit || (data.Department && data.Department === filterObject.unit);
  
      const matchesMeasurmentIdFilter = !filterObject.measurmentId || (data.Measurment_ID && data.Measurment_ID === filterObject.measurmentId);
  
      const matchesYear = !filterObject.year || (
        data.Date && new Date(data.Date).getFullYear() === filterObject.year
      );
  
      const matchesQuarter = !filterObject.quarter || (
        data.Date && Math.floor((new Date(data.Date).getMonth()) / 3) + 1 === filterObject.quarter
      );
  
      const matchesMonth = !filterObject.month || (
        data.Date && new Date(data.Date).getMonth() + 1 === filterObject.month
      );
  
      return matchesGlobalFilter &&
             matchesUnitFilter &&
             matchesMeasurmentIdFilter &&
             matchesYear &&
             matchesQuarter &&
             matchesMonth;
    };
  
    this.dataSource.filter = JSON.stringify({
      global: globalFilterValue,
      unit: unitFilterValue,
      measurmentId: measurmentIdFilterValue,
      year: yearFilter,
      quarter: quarterFilter,
      month: monthFilter
    });
  
    this.totalResults = this.dataSource.filteredData.length;
    this.calculateAllGauges();

    //this.calculateMoneToMechaneGauge(); // recalculate gauge after filter
  }
  

  resetFilters(): void {
    this.filterForm.reset();
    this.applyFilter();
    this.calculateAllGauges(); // optional safety

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
    const workbook: XLSX.WorkBook = { Sheets: { 'דו"ח מדידות - משה': worksheet }, SheetNames: ['דו"ח מדידות - משה'] };
    XLSX.writeFile(workbook, 'דו"ח_מדידות_משה.xlsx');
  }

  isDateColumn(column: string): boolean {
    return ['Date'].includes(column);
  }
  calculateMoneToMechaneGauge(): void {
    const filtered = this.dataSource.filteredData;
  
    this.moneSum = filtered.reduce((sum, row) => sum + (parseFloat(row.Mone) || 0), 0);
    this.mechaneSum = filtered.reduce((sum, row) => sum + (parseFloat(row.Mechane) || 0), 0);
  
    this.moneToMechaneGauge = this.mechaneSum > 0 ? (this.moneSum / this.mechaneSum) * 100 : 0;
  }

  get gaugeTitle(): string {
    const selectedId = this.filterForm.get('measurmentIdFilter')?.value;
    return selectedId
      ? `שיעור ביצוע עבור מדידה: ${selectedId}`
      : 'שיעור ביצוע (מונה / מכנה)';
  }

  getShortDescForMeasurement(id: string): string {
    return this.measurementDescMap[id] || '';
  }

  calculateAllGauges(): void {
    const allData = this.dataSource.filteredData;
    if (!allData.length) return;
  
    const getSum = (data: any[]) => ({
      mone: data.reduce((sum, row) => sum + (parseFloat(row.Mone) || 0), 0),
      mechane: data.reduce((sum, row) => sum + (parseFloat(row.Mechane) || 0), 0),
    });
  
    // Default to most recent year/month if not selected
    const dateList = allData.map(row => new Date(row.Date)).filter(d => !isNaN(d.getTime()));
    const latestDate = dateList.length ? new Date(Math.max(...dateList.map(d => d.getTime()))) : new Date();
  
    const year = +this.filterForm.get('yearFilter')?.value || latestDate.getFullYear();
    const quarter = +this.filterForm.get('quarterFilter')?.value || Math.floor(latestDate.getMonth() / 3) + 1;
    const month = +this.filterForm.get('monthFilter')?.value || (latestDate.getMonth() + 1);
  
    // Year gauge
    const yearData = allData.filter(row => new Date(row.Date).getFullYear() === year);
    const yearSums = getSum(yearData);
    this.moneYear = yearSums.mone;
    this.mechaneYear = yearSums.mechane;
    this.gaugeYear = yearSums.mechane > 0 ? (yearSums.mone / yearSums.mechane) * 100 : 0;
  
    // Quarter gauge
    const quarterData = allData.filter(row =>
      Math.floor(new Date(row.Date).getMonth() / 3) + 1 === quarter &&
      new Date(row.Date).getFullYear() === year
    );
    const quarterSums = getSum(quarterData);
    this.moneQuarter = quarterSums.mone;
    this.mechaneQuarter = quarterSums.mechane;
    this.gaugeQuarter = quarterSums.mechane > 0 ? (quarterSums.mone / quarterSums.mechane) * 100 : 0;
  
    // Month gauge
    const monthData = allData.filter(row =>
      new Date(row.Date).getMonth() + 1 === month &&
      new Date(row.Date).getFullYear() === year
    );
    const monthSums = getSum(monthData);
    this.moneMonth = monthSums.mone;
    this.mechaneMonth = monthSums.mechane;
    this.gaugeMonth = monthSums.mechane > 0 ? (monthSums.mone / monthSums.mechane) * 100 : 0;
  }
  
  expandedRow: string | null = null;

  toggleExpandedRow(measurementCode: string): void {
    console.log('Toggle for:', measurementCode);
    this.expandedRow = this.expandedRow === measurementCode ? null : measurementCode;
  }
  
  isExpandedRow = (index: number, row: any) => {
    return row.MeasurementCode === this.expandedRow;
  };
  
  summaryDisplayedColumns: string[] = [
    'Expand', 'MeasurementCode', 'MeasurementShortDesc', 'TotalMone', 'TotalMechane', 'Grade'
  ];
}
