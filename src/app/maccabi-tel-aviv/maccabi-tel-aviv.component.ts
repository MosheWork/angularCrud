import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-maccabi-tel-aviv',
  templateUrl: './maccabi-tel-aviv.component.html',
  styleUrls: ['./maccabi-tel-aviv.component.scss']
})
export class MaccabiTelAvivComponent implements OnInit {
  images: string[] = [
    'assets/תמונה_קבוצתית_2022-23.jpg',
    'assets/תמונה_קבוצתית_2021-22.jpg',
    'assets/1920px-תמונה_קבוצתית_2018-19.jpg',
    'assets/תמונה_קבוצתית_2016-17.jpg',
 
  ];
  currentIndex = 0;

  ngOnInit(): void {
    setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }, 3000); // Rotate every 3 seconds
  }
}
