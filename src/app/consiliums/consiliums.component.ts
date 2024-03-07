// your-table.component.ts

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment'
interface FormControls {
  [key: string]: FormControl;
}
@Component({
  selector: 'app-consiliums',
  templateUrl: './consiliums.component.html',
  styleUrls: ['./consiliums.component.scss'],
})
export class ConsiliumsComponent implements OnInit {
  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  columns: string[] = [
    'name',
    'id',
    'first_Name',
    'last_Name',
    'question',
    'time',
    'consiliumsUnit',
  ]; // Add more column names

  constructor(private http: HttpClient) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit() {
    // Fetch data from your API endpoint
    // Replace 'YOUR_API_ENDPOINT' with the actual endpoint
    this.http
      .get<any[]>(environment.apiUrl + 'ConsiliumsAPI')
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
  }

  private createFilterForm() {
    const formControls: FormControls = {};
    this.columns.forEach((column) => {
      formControls[column] = new FormControl('');
    });

    return new FormGroup(formControls);
  }

  applyFilters() {
    const filters = this.filterForm.value;

    this.filteredData = this.dataSource.filter((item) =>
      Object.keys(filters).every(
        (key) => !filters[key] || String(item[key]).includes(filters[key])
      )
    );
  }
}
