import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent implements OnInit {
  @Input() isLoading: boolean = false; // Accept loading state from parent

  // ✅ Add multiple images for the slideshow
  loadingImages: string[] = [
    'assets/poriagood1.jfif',
    'assets/poriagood2.jfif',
    'assets/poria icon.jpg',
    'assets/poriagood3.jfif'
  ];
  currentImageIndex: number = 0;

  ngOnInit() {
    setInterval(() => {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.loadingImages.length;
    }, 4000); // Change image every 4 seconds
  }
}
