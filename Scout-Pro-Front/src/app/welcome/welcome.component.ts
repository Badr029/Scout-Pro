import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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

  statistics = {
    scoutCount: 0,
    playerCount: 0,
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    // Fetch scout count
    this.http.get<{ scout_no: number }>('http://localhost:8000/api/scout-count').subscribe({
      next: (res) => {
        this.statistics.scoutCount = res.scout_no;
      },
      error: (err) => {
        console.error('Failed to load scout count', err);
      }
    });

    // Fetch player count
    this.http.get<{ player_no: number }>('http://localhost:8000/api/player-count').subscribe({
      next: (res) => {
        this.statistics.playerCount = res.player_no;
      },
      error: (err) => {
        console.error('Failed to load player count', err);
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/Register-Page']);
  }
}
