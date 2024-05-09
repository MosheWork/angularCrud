import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

interface Guide {
  guideId: number;
  title: string;
  createdBy: string;
  createdDate: Date;
}
@Component({
  selector: 'app-guides-list',
  templateUrl: './guides-list.component.html',
  styleUrls: ['./guides-list.component.scss']
})
export class GuidesListComponent implements OnInit {
  dataSource = new MatTableDataSource<Guide>();
  displayedColumns: string[] = ['guideId', 'title','categoryName', 'createdBy', 'createdDate', 'actions'];

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort!: MatSort;
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}



  ngOnInit(): void {
    this.fetchGuides();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    document.title = 'רשימת מדריכים';
  }

  fetchGuides(): void {
    this.http.get<Guide[]>(`${environment.apiUrl}GuidesAPI/GetAllGuides`).subscribe(
      (guides) => {
        this.dataSource.data = guides;
      },
      (error) => {
        console.error('Error fetching guides:', error);
      }
    );
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  navigateToNewGuide(): void {
    this.router.navigate(['/new-guide']);
  }

  openGuide(id: number): void {
    this.router.navigate(['/guide', id]);
  }

  editGuide(id: number): void {
    this.router.navigate(['/Editguide', id]);
  }
}
