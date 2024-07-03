import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss']
})
export class BoardsComponent implements OnInit {
  boards: any[] = [];
  tasks: any[] = [];
  selectedBoardId: string = '';


  constructor(private http: HttpClient, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.getBoards().subscribe(data => {
      this.boards = data.data.boards;
    });

    this.route.params.subscribe(params => {
      if (params['boardId']) {
        this.selectedBoardId = params['boardId'];
        this.getTasks(this.selectedBoardId).subscribe(data => {
          this.tasks = data.data.boards[0].items_page.items;
        });
      }
    });
  }

  getBoards(): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards`);
  }

  getTasks(boardId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}Monday/boards/${boardId}/tasks`);
  }
}
