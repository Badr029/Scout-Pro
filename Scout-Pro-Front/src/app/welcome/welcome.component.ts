import {
  Component,
  OnInit,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: [
    './welcome.component.scss',
    '../shared/styles/auth-background.css'
  ],
  encapsulation: ViewEncapsulation.None,
})
export class WelcomeComponent implements OnInit {
  @ViewChild('scoutCounter', { static: false }) scoutCounter!: ElementRef;
  @ViewChild('playerCounter', { static: false }) playerCounter!: ElementRef;

  statistics = {
    scoutCount: 0,
    playerCount: 0,
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.http.get<{ scout_no: number }>('http://localhost:8000/api/scout-count').subscribe({
      next: (res) => {
        this.statistics.scoutCount = res.scout_no;
        this.animateCount(this.scoutCounter.nativeElement, res.scout_no);
      },
      error: (err) => {
        console.error('Failed to load scout count', err);
      }
    });

    this.http.get<{ player_no: number }>('http://localhost:8000/api/player-count').subscribe({
      next: (res) => {
        this.statistics.playerCount = res.player_no;
        this.animateCount(this.playerCounter.nativeElement, res.player_no);
      },
      error: (err) => {
        console.error('Failed to load player count', err);
      }
    });
  }

  animateCount(element: HTMLElement, target: number) {
    let count = 0;
    const increment = Math.ceil(target / 100);

    const update = () => {
      count += increment;
      if (count < target) {
        element.innerText = count.toString();
        requestAnimationFrame(update);
      } else {
        element.innerText = target.toLocaleString();
      }
    };

    update();
  }

  navigateToRegister(): void {
    this.router.navigate(['/Register-Page']);
  }
}
