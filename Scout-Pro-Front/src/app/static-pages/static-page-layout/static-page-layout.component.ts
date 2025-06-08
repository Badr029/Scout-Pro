import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-static-page-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="static-page">
      <header class="page-header">
        <div class="container">
          <h1>{{title}}</h1>
          <div class="breadcrumb">
            <a routerLink="/">Home</a>
            <span class="separator">/</span>
            <span class="current">{{title}}</span>
          </div>
        </div>
      </header>

      <div class="page-content">
        <div class="container">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .static-page {
      min-height: calc(100vh - 300px); // Account for header and footer
      background: var(--dark-bg);
    }

    .page-header {
      background: var(--dark-surface);
      padding: 4rem 0;
      border-bottom: 1px solid var(--dark-border);
      margin-bottom: 3rem;

      h1 {
        color: var(--text-accent);
        font-size: 2.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }
    }

    .breadcrumb {
      color: var(--text-secondary);
      font-size: 0.875rem;

      a {
        color: var(--primary-blue);
        text-decoration: none;
        transition: color var(--transition-fast);

        &:hover {
          color: var(--primary-blue-light);
        }
      }

      .separator {
        margin: 0 0.5rem;
      }

      .current {
        color: var(--text-secondary);
      }
    }

    .page-content {
      padding: 2rem 0 5rem;

      ::ng-deep {
        h2 {
          color: var(--text-accent);
          font-size: 1.75rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        h3 {
          color: var(--text-accent);
          font-size: 1.25rem;
          margin: 2rem 0 1rem;
          font-weight: 600;
        }

        p {
          color: var(--text-secondary);
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        ul, ol {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;

          li {
            margin-bottom: 0.75rem;
          }
        }
      }
    }

    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 3rem 0;

        h1 {
          font-size: 2rem;
        }
      }
    }
  `]
})
export class StaticPageLayoutComponent {
  @Input() title: string = '';
}
