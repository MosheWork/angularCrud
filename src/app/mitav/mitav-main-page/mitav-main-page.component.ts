import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mitav-main-page',
  templateUrl: './mitav-main-page.component.html',
  styleUrls: ['./mitav-main-page.component.scss']
})
export class MItavMainPageComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  cards = [
    { title: 'Shiba Inu', subtitle: 'Dog Breed', img: 'https://material.angular.io/assets/img/examples/shiba2.jpg', link: 'http://localhost:4200/#/MitavMobility', external: true },
    { title: 'Golden Retriever', subtitle: 'Friendly Dog', img: 'https://example.com/golden.jpg', link: '/golden', external: false },
    { title: 'Persian Cat', subtitle: 'Fluffy Cat', img: 'https://example.com/persian.jpg', link: 'https://en.wikipedia.org/wiki/Persian_cat', external: true }
  ];

  openLink(card: any) {
    if (card.external) {
      window.open(card.link, '_blank'); // Open external link in a new tab
    } else {
      window.location.href = card.link; // Redirect within the app
    }
  }

}
