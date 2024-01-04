import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup,FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';





interface FormControls {
  [key: string]: FormControl;
}
@Component({
  selector: 'app-isolation',
  templateUrl: './isolation.component.html',
  styleUrls: ['./isolation.component.scss'],
})
export class IsolationComponent implements OnInit {
  tableTitle: string = 'דוח בידודים';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];

  columns: string[] = [
    'id_Num',
    'answer_Text_Type',
    'answer_Text',
    'first_Name',
    'last_Name',
    'enterance_Date',
    'departure_Date',
    'departure_Reason',
    'first_Name_g',
    'last_Name_g',
    'login_Name',
  ]; // Add more column names

  getColumnLabel(column: string): string {

    const columnLabels: Record<string, string> = {
      id_Num: 'תעודת זהות',
      answer_Text: 'סיבת בידוד',
      answer_Text_Type: 'סוג בידוד',
      department: 'מחלקה',
      enterance_Date: 'תאריך כניסה לבידוד',
      departure_Date: 'תאריך יציאה מבידוד',
      departure_Reason: 'סיבת יציאה מבידוד',
      first_Name: 'שם פרטי',
      last_Name: 'שם משפחה',
      first_Name_g: 'שם פרטי העובד המתעד',
      last_Name_g:' שם משפחה העובד המתעד',
      login_Name: 'שם משתמש',
    };
   
    return columnLabels[column] || column; // Use the label if available, otherwise use the column name
  }
  constructor(private http: HttpClient) {
    this.filterForm = this.createFilterForm();
   

  }

  ngOnInit() {
    // Fetch data from your API endpoint
    // Replace 'YOUR_API_ENDPOINT' with the actual endpoint
    this.http
      .get<any[]>('http://localhost:7144/api/IsolationAPI')
      .subscribe((data) => {
        this.dataSource = data;
        this.filteredData = [...data]; // Initially set filtered data to all data
      });
    this.columns.forEach((column) => {
      this.filterForm
        .get(column)
        ?.valueChanges.pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(() => this.applyFilters());
    });

    // Set up paginator after data is loaded
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
      this.paginator.firstPage();
    });
  }

  private createFilterForm() {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });
    formControls['globalFilter'] = new FormControl(''); // Add global filter

    return new FormGroup(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const globalFilter = filters['globalFilter'].toLowerCase(); // Get global filter value
  
    this.filteredData = this.dataSource.filter((item) =>
      this.columns.every((column) => {
        const value = String(item[column]).toLowerCase();
        return !filters[column] || value.includes(filters[column]);
      }) &&
      (
        globalFilter === '' || // Include the row if global filter is empty
        this.columns.some((column) => String(item[column]).toLowerCase().includes(globalFilter))
      )
    );
  }
}
