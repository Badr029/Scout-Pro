import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { StatsService, Stats } from '../services/stats.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dynamic-welcome',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dynamic-welcome.component.html',
  styleUrls: ['./dynamic-welcome.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('slideInUp', [
      transition(':enter', [
        style({ transform: 'translateY(50px)', opacity: 0 }),
        animate('0.8s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeInLeft', [
      transition(':enter', [
        style({ transform: 'translateX(-50px)', opacity: 0 }),
        animate('1s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeInRight', [
      transition(':enter', [
        style({ transform: 'translateX(50px)', opacity: 0 }),
        animate('1s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('zoomIn', [
      transition(':enter', [
        style({ transform: 'scale(0.5)', opacity: 0 }),
        animate('0.8s ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class DynamicWelcomeComponent implements OnInit, AfterViewInit {
  @ViewChild('demoVideo') demoVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('scoutCounter') scoutCounter!: ElementRef;
  @ViewChild('playerCounter') playerCounter!: ElementRef;
  @ViewChild('videoCounter') videoCounter!: ElementRef;
  @ViewChild('connectionCounter') connectionCounter!: ElementRef;

  currentSlide = 0;
  currentTestimonial = 0;
  stats: Stats = {
    scout_no: 0,
    player_no: 0,
    video_no: 0,
    contact_no: 0
  };

  statsDisplay = [
    { number: 0, label: 'Professional Scouts', suffix: '+', key: 'scout_no' },
    { number: 0, label: 'Talented Players', suffix: '+', key: 'player_no' },
    { number: 0, label: 'Video Showcases', suffix: '+', key: 'video_no' },
    { number: 0, label: 'Successful Connections', suffix: '+', key: 'contact_no' }
  ];

  features = [
    {
      title: 'Scout Discovery',
      description: 'Connect with professional scouts worldwide and showcase your talent',
      image: 'assets/screenshots/scout-profile-contacted-players.png',
      icon: 'search'
    },
    {
      title: 'Video Feed Platform',
      description: 'Share your skills through dynamic video content and get discovered',
      image: 'assets/screenshots/feed-page.png',
      icon: 'user'
    },
    {
      title: 'Player Profiles',
      description: 'Create comprehensive profiles that showcase your football journey',
      image: 'assets/screenshots/player-profile.png',
      icon: 'user'
    },
    {
      title: 'Advanced Search',
      description: 'Find the perfect players with intelligent filtering systems',
      image: 'assets/screenshots/search-bar.png',
      icon: 'filter'
    },
    {
      title: 'Event Management',
      description: 'Organize and participate in football events and tournaments',
      image: 'assets/screenshots/events-tab.png',
      icon: 'calendar'
    }
  ];

  testimonials = [
    {
      name: 'Marcus Silva',
      role: 'Professional Scout',
      text: 'Scout-Pro revolutionized how I discover talent. The platform\'s filtering system helped me find hidden gems across different regions.',
      avatar: '👨‍💼'
    },
    {
      name: 'Ahmed Hassan',
      role: 'Aspiring Player',
      text: 'Thanks to Scout-Pro, I connected with three professional scouts and received my first trial opportunity!',
      avatar: '⚽'
    },
    {
      name: 'Sofia Rodriguez',
      role: 'Football Agent',
      text: 'The video showcase feature is incredible. It gives me a real sense of player capabilities before making contact.',
      avatar: '👩‍💼'
    }
  ];

  constructor(
    private router: Router,
    private statsService: StatsService
  ) {}

  ngOnInit() {
    this.startSlideshow();
    this.startTestimonialRotation();
    this.loadStats();
  }

  loadStats() {
    this.statsService.getAllStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.statsDisplay = this.statsDisplay.map(stat => ({
          ...stat,
          number: this.stats[stat.key as keyof Stats]
        }));
        if (this.scoutCounter) {
          this.animateCounters();
        }
      },
      error: (error) => {
        console.error('Error fetching stats:', error);
      }
    });
  }

  ngAfterViewInit() {
    if (this.stats.scout_no > 0) {
      this.animateCounters();
    }
    this.setupVideo();
  }

  setupVideo() {
    if (this.demoVideo?.nativeElement) {
      const video = this.demoVideo.nativeElement;

      // Ensure video is muted
      video.muted = true;
      video.volume = 0;

      // Ensure video starts playing
      const playVideo = () => {
        video.muted = true; // Ensure muted state is maintained
        video.volume = 0;   // Double ensure no sound
        video.play().catch(error => {
          console.warn('Auto-play failed:', error);
        });
      };

      // Play video when it's loaded
      video.addEventListener('loadedmetadata', playVideo);

      // Handle video end
      video.addEventListener('ended', () => {
        video.currentTime = 0;
        playVideo();
      });

      // Ensure muted state is maintained if user tries to unmute
      video.addEventListener('volumechange', () => {
        if (!video.muted || video.volume > 0) {
          video.muted = true;
          video.volume = 0;
        }
      });

      // Try to play immediately if the video is already loaded
      if (video.readyState >= 2) {
        playVideo();
      }
    }
  }

  startSlideshow() {
    setInterval(() => {
      this.currentSlide = (this.currentSlide + 1) % this.features.length;
    }, 4000);
  }

  startTestimonialRotation() {
    setInterval(() => {
      this.currentTestimonial = (this.currentTestimonial + 1) % this.testimonials.length;
    }, 5000);
  }

  animateCounters() {
    const counters = [
      { element: this.scoutCounter, target: this.stats.scout_no },
      { element: this.playerCounter, target: this.stats.player_no },
      { element: this.videoCounter, target: this.stats.video_no },
      { element: this.connectionCounter, target: this.stats.contact_no }
    ];

    counters.forEach(({ element, target }) => {
      if (element) {
        this.animateValue(element.nativeElement, 0, target, 2000);
      }
    });
  }

  animateValue(element: HTMLElement, start: number, end: number, duration: number) {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      element.textContent = current.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.features.length;
  }

  prevSlide() {
    this.currentSlide = this.currentSlide === 0 ? this.features.length - 1 : this.currentSlide - 1;
  }
}
