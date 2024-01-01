import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-sql',
  templateUrl: './sql.component.html',
  styleUrls: ['./sql.component.scss'],
})
export class SQLComponent {
  optionValue: any;

  selectionChange: any;

  // onChange(event:any) {
  //   this.selectedType = event.target.value;
  // }

  someMethod(value: any) {
    this.selectionChange = value;
  }
}
