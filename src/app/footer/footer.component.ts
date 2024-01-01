import { Component,OnInit  } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit  {
  constructor() { }


  year: number = 0;
  now =  new Date;
  ngOnInit() {
    this.year = this.now.getFullYear();
  }
}
