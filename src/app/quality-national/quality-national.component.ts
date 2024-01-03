import { Component, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';


@Component({
  selector: 'app-quality-national',
  templateUrl: './quality-national.component.html',
  styleUrls: ['./quality-national.component.scss']
})

export class QualityNationalComponent  {
  displayedColumns: string[] = ['name','description','action'];
  dataSource = new MatTableDataSource<any>([
    { name: 'Hydrogen',description:'דוח'},

    // Add more data as needed
  ]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filterPredicate = (data, filter) => {
      const value = data[column]?.toString().toLowerCase();
      return value.includes(filter.toLowerCase());
    };
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}