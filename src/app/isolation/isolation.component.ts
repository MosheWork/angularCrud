import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';


interface FormControls {
  [key: string]: FormControl;
}
@Component({
  selector: 'app-isolation',
  templateUrl: './isolation.component.html',
  styleUrls: ['./isolation.component.scss']
})
export class IsolationComponent implements OnInit {
  filterForm: FormGroup;
  dataSource: any[] = [];
  filteredData: any[] = [];
  columns: string[] = ['name', 'id','first_Name','last_Name','question','time','consiliumsUnit']; // Add more column names


  constructor(private http: HttpClient) {
    this.filterForm = this.createFilterForm();
  }
 
  ngOnInit() {
    // Fetch data from your API endpoint
    // Replace 'YOUR_API_ENDPOINT' with the actual endpoint
    this.http.get<any[]>('http://localhost:7144/api/IsolationAPI').subscribe((data) => {
      this.dataSource = data;
      this.filteredData = [...data]; // Initially set filtered data to all data
    });
    this.columns.forEach((column) => {
      this.filterForm.get(column)?.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
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
