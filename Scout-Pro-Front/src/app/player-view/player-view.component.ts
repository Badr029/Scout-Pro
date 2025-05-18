import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-player-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-view.component.html',
  styleUrl: './player-view.component.css',
  encapsulation: ViewEncapsulation.None
})
export class PlayerViewComponent {
  playerId: string | null = null;
  activeTab = 'about';
  player = {
    name: 'Ethan Nwaneri',
    rating: 4.3,
    likes: '10K+',
    bio: 'Ethan Chidiebere Nwaneri is an English professional footballer who plays as a right winger or attacking midfielder for Premier League club Arsenal. Born in North London',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=facearea&w=800&h=400',
    height: '176 cm',
    weight: '68 kg',
    shirt: '57',
    age: '17 years',
    dob: 'Mar 21, 2007',
    foot: 'Left',
    country: 'England',
    marketValue: '$13M',
    club: 'Arsenal',
    position: {
      primary: 'Central Midfielder',
      other: 'Attacking Midfielder, Right Winger',
      diagram: 'https://i.imgur.com/1Q9Z1Zm.png' // placeholder pitch image
    },
    career: [
      { years: '2021-2022', club: 'Arsenal U18', stats: '10 apps, 3 goals' },
      { years: '2022-2024', club: 'Arsenal', stats: '15 apps, 2 goals' },
      { years: '2024-Present', club: 'Arsenal', stats: 'Current' }
    ]
  };
  videos = [
    {
      title: 'Ethan Nwaneri is a Force of Nature 2024',
      thumbnail: 'https://i.imgur.com/2nCt3Sbl.jpg',
      url: 'https://www.youtube.com/watch?v=xxxx',
      channel: 'Nwaneri',
      views: '44K',
      time: '4 months ago',
      duration: '54:48',
      avatar: 'https://ui-avatars.com/api/?name=Ethan+Nwaneri'
    }
  ];

  constructor(private route: ActivatedRoute) {
    this.playerId = this.route.snapshot.paramMap.get('id');
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }
}
