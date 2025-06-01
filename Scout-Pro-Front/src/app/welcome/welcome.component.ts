import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class WelcomeComponent implements OnInit {
  
  statistics = {
    totalScouts: '0',
    totalPlayers: '0',
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  loadStatistics(): void {
    // Fetch scout count
    this.http.get<{ scout_no: number }>('/api/scoutCount').subscribe({
      next: (res) => {
        this.statistics.totalScouts = res.scout_no.toLocaleString();
      },
      error: (err) => {
        console.error('Failed to load scout count', err);
      }
    });

    // Fetch player count
    this.http.get<{ player_no: number }>('/api/playerCount').subscribe({
      next: (res) => {
        this.statistics.totalPlayers = res.player_no.toLocaleString();
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
