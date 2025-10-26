import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

type Row = {
  unitName: string;
  admission_No: number;
  name: string;
  age_Years: number;
  room: string;
  gender_Text: string;
  totalDaysInHosp: number;
  labResultAfterAdmission: number;
  norton: string;
  bmi: number;
  wayOfFeding: string;
  stampGrade: number;
  skinIntegrityAnswer: string;
  hasConsilium150685814: string;
  lastConsiliumAnswerDate?: string;
  typeOfFood: string;
  foodTexture: string;
  daysSinceLastHosp?: number;

  weightKg?: number;
  heightCm?: number;

  // NEW
  allergy?: string;          // Allergy_IDTextList
  mustGrade?: number;        // AE2_Grade (>=2)
  dxICD9List?: string;       // Diagnosis ICD-9 matches
  procICD9List?: string;     // Procedure ICD-9 matches

  isAgeRule: boolean;
  isRecent30dRule: boolean;
  isLabRule: boolean;
  nortonRule: boolean;
  isBMIRule: boolean;
  isNonOralRouteRule: boolean;
  stampRule: boolean;
  isSkinIntegrityRule: boolean;

  // NEW rule bits
  allergyRule?: boolean;
  mustRule?: boolean;
  dxICD9Rule?: boolean;
  procICD9Rule?: boolean;

  reason: string;
};


@Component({
  selector: 'app-galit',
  templateUrl: './galit.component.html',
  styleUrls: ['./galit.component.scss']
})
export class GalitComponent implements OnInit {

  titleUnit = 'גלית ';
  Title1 = '— ';
  Title2 = 'סה״כ תוצאות ';
  totalResults = 0;
  loading = false;

  columns: (keyof Row)[] = [
    'unitName','admission_No','name','age_Years','gender_Text','room','totalDaysInHosp',
    'labResultAfterAdmission','norton','bmi','wayOfFeding','stampGrade',
    'skinIntegrityAnswer','hasConsilium150685814','lastConsiliumAnswerDate',
    'typeOfFood','foodTexture','daysSinceLastHosp',
    'weightKg','heightCm',
    // NEW visible columns
    'allergy','mustGrade','dxICD9List','procICD9List'
    // 'reason'
  ];
  

  filterForm: FormGroup;
  matTableDataSource = new MatTableDataSource<Row>([]);
  dataSource: Row[] = [];
  filteredData: Row[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, fb: FormBuilder) {
    const ctrls: Record<string, FormControl> = {};
    this.columns.forEach(c => ctrls[c] = new FormControl(''));
    ctrls['globalFilter'] = new FormControl('');
    this.filterForm = fb.group(ctrls);
  }

  ngOnInit(): void {
    this.load();
    Object.keys(this.filterForm.controls).forEach(k => {
      this.filterForm.get(k)!.valueChanges
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });
  }

  private load(): void {
    this.loading = true;
    this.http.get<Row[]>(`${environment.apiUrl}galit`).subscribe({
      next: rows => {
        // normalize casing from API → camel-ish keys used above
        const norm = (rows || []).map((r: any) => ({
          unitName: r.UnitName ?? r.unitName ?? '',
          admission_No: r.Admission_No ?? r.admission_No ?? null,
          name: r.Name ?? r.name ?? '',
          age_Years: r.Age_Years ?? r.age_Years ?? null,
          room: r.Room ?? r.room ?? '',
          gender_Text: r.Gender_Text ?? r.gender_Text ?? '',
          totalDaysInHosp: r.TotalDaysInHosp ?? r.totalDaysInHosp ?? null,
          labResultAfterAdmission: r.LabResultAfterAdmission ?? r.labResultAfterAdmission ?? null,
          norton: r.Norton ?? r.norton ?? '',
          bmi: r.BMI ?? r.bmi ?? null,
          wayOfFeding: r.WayOfFeding ?? r.wayOfFeding ?? '',
          stampGrade: r.StampGrade ?? r.stampGrade ?? null,
          skinIntegrityAnswer: r.SkinIntegrityAnswer ?? r.skinIntegrityAnswer ?? '',
          hasConsilium150685814: r.HasConsilium150685814 ?? r.hasConsilium150685814 ?? '',
          lastConsiliumAnswerDate: r.LastConsiliumAnswerDate ?? r.lastConsiliumAnswerDate ?? null,
          typeOfFood: r.TypeOfFood ?? r.typeOfFood ?? '',
          foodTexture: r.FoodTexture ?? r.foodTexture ?? '',
          daysSinceLastHosp: r.DaysSinceLastHosp ?? r.daysSinceLastHosp ?? null,
        
          // assumes SQL alias fix: WeightKg=105, HeightCm=4
          weightKg: r.WeightKg ?? r.weightKg ?? null,
          heightCm: r.HeightCm ?? r.heightCm ?? null,
        
          // NEW columns
          allergy: r.Allergy ?? r.allergy ?? '',
          mustGrade: r.MustGrade ?? r.mustGrade ?? null,
          dxICD9List: r.DxICD9List ?? r.dxICD9List ?? '',
          procICD9List: r.ProcICD9List ?? r.procICD9List ?? '',
        
          isAgeRule: !!(r.IsAgeRule ?? r.isAgeRule),
          isRecent30dRule: !!(r.IsRecent30dRule ?? r.isRecent30dRule),
          isLabRule: !!(r.IsLabRule ?? r.isLabRule),
          nortonRule: !!(r.NortonRule ?? r.nortonRule),
          isBMIRule: !!(r.IsBMIRule ?? r.isBMIRule),
          isNonOralRouteRule: !!(r.IsNonOralRouteRule ?? r.isNonOralRouteRule),
          stampRule: !!(r.StampRule ?? r.stampRule),
          isSkinIntegrityRule: !!(r.IsSkinIntegrityRule ?? r.isSkinIntegrityRule),
        
          // NEW rule bits
          allergyRule: !!(r.AllergyRule ?? r.allergyRule),
          mustRule: !!(r.MustRule ?? r.mustRule),
          dxICD9Rule: !!(r.DxICD9Rule ?? r.dxICD9Rule),
          procICD9Rule: !!(r.ProcICD9Rule ?? r.procICD9Rule),
        
          reason: r.Reason ?? r.reason ?? ''
        })) as Row[];
        
        this.dataSource = norm;
        this.filteredData = [...norm];
        this.matTableDataSource.data = this.filteredData;
        this.totalResults = this.filteredData.length;
        setTimeout(() => {
          this.matTableDataSource.paginator = this.paginator;
          this.matTableDataSource.sort = this.sort;
        });
      },
      error: _ => alert('שגיאה בטעינת גלית'),
      complete: () => this.loading = false
    });
  }

  getColumnLabel(c: keyof Row | 'globalFilter'): string {
    const labels: Record<string,string> = {
      unitName:'שם יחידה',
      admission_No:'מס׳ אשפוז',
      name:'שם',
      age_Years:'גיל',
      room:'חדר',
      gender_Text:'מין',
      totalDaysInHosp:'ימי אשפוז',
      labResultAfterAdmission:'אלבומין ',
      norton:'נורטון ',
      bmi:'BMI',
      wayOfFeding:'דרך מתן',
      stampGrade:'Stamp',
      skinIntegrityAnswer:' פצע לחץ ',
      hasConsilium150685814:'האם קיים ייעוץ  ',
      lastConsiliumAnswerDate:'תאריך ייעוץ תזונה אחרון ',
      typeOfFood:' תזונה ',
      foodTexture:'מרקם מזון',
      daysSinceLastHosp:'ימים מאז שחרור קודם',
      weightKg:'משקל (ק״ג)',
      heightCm:'גובה (ס״מ)',
      reason:'נימוק',
      globalFilter:'חיפוש',
      allergy:'אלרגיות (שם)',
      mustGrade:'Must',
      dxICD9List:'אבחנות',
      procICD9List:'פרוצדורות '
     
    };
    return labels[c] ?? (c as string);
  }

  getFormControl(c: keyof Row | 'globalFilter') { return this.filterForm.get(c) as FormControl; }

  resetFilters(): void {
    const g = this.getFormControl('globalFilter').value;
    this.filterForm.reset();
    this.getFormControl('globalFilter').setValue(g ? '' : '');
    this.applyFilters();
    this.paginator?.firstPage();
  }

  applyFilters(): void {
    const vals = this.filterForm.value as Record<string,string>;
    const global = (vals['globalFilter'] || '').toLowerCase();

    this.filteredData = this.dataSource.filter(row => {
      const perCol = this.columns.every(col => {
        const needle = (vals[col as string] || '').toLowerCase().trim();
        if (!needle) return true;
        const val = ((row[col] ?? '') + '').toLowerCase();
        return val.includes(needle);
      });
      const globalOk = !global || this.columns.some(col =>
        (((row[col] ?? '') + '').toLowerCase().includes(global))
      );
      return perCol && globalOk;
    });

    this.totalResults = this.filteredData.length;
    this.matTableDataSource.data = this.filteredData;
    this.matTableDataSource.paginator = this.paginator;
    this.matTableDataSource.sort = this.sort;
  }

  exportToExcel(): void {
    const ws = XLSX.utils.json_to_sheet(this.filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Galit');
    XLSX.writeFile(wb, 'galit.xlsx');
  }

  getCellClass(c: string, row: Row): Record<string, boolean> {
    const hasCons = (row.hasConsilium150685814 || '').toString().trim().toLowerCase();
    const noCons = hasCons === 'no' || hasCons === 'לא'; // keep Hebrew “No” if needed
  
    const isHospDanger =
      c === 'totalDaysInHosp' &&
      row.totalDaysInHosp != null &&
      row.totalDaysInHosp >= 10 &&
      noCons;
  
    const isLabDanger =
      c === 'labResultAfterAdmission' &&
      row.labResultAfterAdmission != null &&
      row.labResultAfterAdmission <= 2.5;
  
    return {
      danger: isHospDanger || isLabDanger
    };
  }
  // Counts based on the filtered rows (the user’s view)
get totalPatients(): number {
  return this.filteredData.length;
}

get noConsiliumCount(): number {
  return this.filteredData.filter(r =>
    (r.hasConsilium150685814? r.hasConsilium150685814 : r.hasConsilium150685814) // guard if typo
  ,).length;
}

// ^ Oops, better correct implementation:
get noConsilium150685814Count(): number {
  return this.filteredData.filter(r => {
    const noCons = (r.hasConsilium150685814 || '').toString().trim().toLowerCase() === 'no';
    const daysOk = (r.totalDaysInHosp ?? 0) >= 10;
    return noCons && daysOk;
  }).length;
}


// Albumin alert: <= 2.5 (change to 3 if you want a wider net)
 readonly albuminThreshold = 2.5;

get lowAlbuminCount(): number {
  return this.filteredData.filter(r =>
    r.labResultAfterAdmission != null && r.labResultAfterAdmission <= this.albuminThreshold
  ).length;
}

}
