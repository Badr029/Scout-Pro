import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaticPageLayoutComponent } from '../static-page-layout/static-page-layout.component';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, StaticPageLayoutComponent],
  template: `
    <app-static-page-layout title="Features">
      <div class="features-content">
        <section class="intro-section">
          <h2>Powerful Tools for Players and Scouts</h2>
          <p>
            Scout Pro offers a comprehensive suite of features designed to revolutionize football scouting and player
            development. Our platform brings together cutting-edge technology and industry expertise to create
            unprecedented opportunities in the world of football.
          </p>
        </section>

        <div class="features-grid">
          <div class="feature-card" *ngFor="let feature of features">
            <div class="feature-icon" [innerHTML]="feature.icon"></div>
            <h3>{{feature.title}}</h3>
            <p>{{feature.description}}</p>
            <ul class="feature-list">
              <li *ngFor="let point of feature.points">{{point}}</li>
            </ul>
          </div>
        </div>
      </div>
    </app-static-page-layout>
  `,
  styles: [`
    .features-content {
      .intro-section {
        text-align: center;
        max-width: 800px;
        margin: 0 auto 4rem;
      }
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      background: var(--dark-surface);
      border-radius: var(--border-radius-md);
      padding: 2rem;
      border: 1px solid var(--dark-border);
      transition: transform var(--transition-normal);

      &:hover {
        transform: translateY(-4px);
      }

      .feature-icon {
        margin-bottom: 1.5rem;
        color: var(--primary-blue);

        svg {
          width: 48px;
          height: 48px;
        }
      }

      h3 {
        margin-bottom: 1rem;
      }

      p {
        margin-bottom: 1.5rem;
      }

      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          position: relative;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--text-secondary);

          &:before {
            content: "•";
            color: var(--primary-blue);
            position: absolute;
            left: 0;
            font-size: 1.2em;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .features-grid {
        grid-template-columns: 1fr;
      }

      .feature-card {
        padding: 1.5rem;
      }
    }
  `]
})
export class FeaturesComponent {
  features = [
    {
      title: 'Player Profiles',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      description: 'Create and manage your professional football profile.',
      points: [
        'Comprehensive player statistics',
        'Video highlights integration',
        'Performance analytics',
        'Achievement tracking'
      ]
    },
    {
      title: 'Scout Network',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
      description: 'Connect with verified professional scouts worldwide.',
      points: [
        'Direct messaging system',
        'Scout verification process',
        'Club affiliation tracking',
        'Scouting report generation'
      ]
    },
    {
      title: 'Video Analysis',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
      description: 'Advanced video tools for performance analysis.',
      points: [
        'HD video upload capability',
        'Clip editing and annotation',
        'Performance metrics overlay',
        'Sharing and embedding options'
      ]
    },
    {
      title: 'Match Events',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      description: 'Discover and participate in scouting events.',
      points: [
        'Tournament listings',
        'Trial match organization',
        'Event registration',
        'Real-time updates'
      ]
    },
    {
      title: 'AI Scouting',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
      description: 'AI-powered talent identification and analysis.',
      points: [
        'Performance prediction',
        'Talent matching algorithm',
        'Development tracking',
        'Potential assessment'
      ]
    },
    {
      title: 'Mobile Access',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>',
      description: 'Access Scout Pro anywhere, anytime.',
      points: [
        'Native mobile apps',
        'Offline capability',
        'Push notifications',
        'Real-time updates'
      ]
    }
  ];
}
