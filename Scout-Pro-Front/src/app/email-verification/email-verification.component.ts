import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './email-verification.component.html',
  styleUrls: ['./email-verification.component.css']
})
export class EmailVerificationComponent implements OnInit {
  loading = true;
  success = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    const hash = this.route.snapshot.params['hash'];
    const expires = this.route.snapshot.queryParams['expires'];
    const signature = this.route.snapshot.queryParams['signature'];

    // Construct the verification URL for the backend
    const verificationUrl = `http://localhost:8000/api/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`;

    // Send verification request
    this.http.get(verificationUrl).subscribe({
      next: (response: any) => {
        this.success = true;
        this.message = 'Your email has been verified successfully!';
        this.loading = false;
      },
      error: (error) => {
        this.success = false;
        this.message = error.error.message || 'Email verification failed. Please try again.';
        this.loading = false;
      }
    });
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
