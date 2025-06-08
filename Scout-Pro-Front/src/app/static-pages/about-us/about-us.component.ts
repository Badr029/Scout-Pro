import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaticPageLayoutComponent } from '../static-page-layout/static-page-layout.component';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, StaticPageLayoutComponent],
  template: `
    <app-static-page-layout title="About Us">
      <div class="about-content">
        <section class="mission-section">
          <h2>Our Mission</h2>
          <p>
            At Scout Pro, we're revolutionizing the way football talent is discovered and developed. Our platform bridges
            the gap between aspiring players and professional scouts, creating opportunities that transcend geographical
            and economic barriers.
          </p>
        </section>

        <section class="vision-section">
          <h2>Our Vision</h2>
          <p>
            We envision a future where every talented footballer has the opportunity to be discovered, regardless of their
            location or background. Through technology and innovation, we're making professional football more accessible
            and transparent than ever before.
          </p>
        </section>

        <section class="team-section">
          <h2>Our Team</h2>
          <div class="team-grid">
            <div class="team-member" *ngFor="let member of teamMembers">
              <div class="member-avatar">{{member.initials}}</div>
              <h3>{{member.name}}</h3>
              <p class="member-role">{{member.role}}</p>
            </div>
          </div>
        </section>

        <section class="values-section">
          <h2>Our Values</h2>
          <div class="values-grid">
            <div class="value-card">
              <div class="value-icon">🎯</div>
              <h3>Innovation</h3>
              <p>Constantly pushing boundaries to create better opportunities in football.</p>
            </div>
            <div class="value-card">
              <div class="value-icon">🤝</div>
              <h3>Integrity</h3>
              <p>Operating with transparency and honesty in all our dealings.</p>
            </div>
            <div class="value-card">
              <div class="value-icon">⚡</div>
              <h3>Excellence</h3>
              <p>Striving for the highest quality in everything we do.</p>
            </div>
            <div class="value-card">
              <div class="value-icon">🌍</div>
              <h3>Inclusivity</h3>
              <p>Creating opportunities for talent from all backgrounds.</p>
            </div>
          </div>
        </section>
      </div>
    </app-static-page-layout>
  `,
  styles: [`
    .about-content {
      section {
        margin-bottom: 4rem;
      }
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .team-member {
      text-align: center;
      padding: 2rem;
      background: var(--dark-surface);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--dark-border);
      transition: transform var(--transition-normal);

      &:hover {
        transform: translateY(-4px);
      }

      .member-avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--primary-blue);
        color: var(--text-accent);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 600;
        margin: 0 auto 1.5rem;
      }

      h3 {
        margin-bottom: 0.5rem;
      }

      .member-role {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    }

    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .value-card {
      padding: 2rem;
      background: var(--dark-surface);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--dark-border);
      text-align: center;

      .value-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      h3 {
        margin-bottom: 1rem;
      }

      p {
        font-size: 0.9rem;
        margin: 0;
      }
    }

    @media (max-width: 768px) {
      .team-grid,
      .values-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
      }

      .team-member {
        padding: 1.5rem;
      }
    }
  `]
})
export class AboutUsComponent {
  teamMembers = [
    { name: 'John Smith', role: 'CEO & Founder', initials: 'JS' },
    { name: 'Sarah Johnson', role: 'Head of Scouting', initials: 'SJ' },
    { name: 'Mike Williams', role: 'Technical Director', initials: 'MW' },
    { name: 'Emma Davis', role: 'Player Relations', initials: 'ED' }
  ];
}
