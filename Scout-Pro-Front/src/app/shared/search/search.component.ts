import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  searchForm: FormGroup;
  filterForm: FormGroup;
  isScout: boolean = false;
  searchResults: any[] = [];
  filterOptions: any = {};
  recentSearches: string[] = [];
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.searchForm = this.fb.group({
      query: ['']
    });

    this.filterForm = this.fb.group({
      age_range: [''],
      preferred_foot: [''],
      region: [''],
      transfer_status: ['']
    });

    this.isScout = this.authService.getCurrentUser()?.user_type === 'scout';
  }

  ngOnInit() {
    // Subscribe to search input changes with debounce
    this.searchForm.get('query')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.performSearch();
      });

    // Subscribe to filter changes
    if (this.isScout) {
      this.filterForm.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe(() => {
          this.performSearch();
        });
    }
  }

  performSearch() {
    this.loading = true;
    const searchData = {
      query: this.searchForm.get('query')?.value,
      filters: this.isScout ? this.filterForm.value : {}
    };

    this.apiService.postData('search', searchData).subscribe({
      next: (response: any) => {
        this.searchResults = response.data.players;
        this.filterOptions = response.data.filter_options || {};
        this.recentSearches = response.data.recent_searches;
        this.loading = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.loading = false;
      }
    });
  }

  useRecentSearch(query: string) {
    this.searchForm.patchValue({ query });
  }

  clearSearch() {
    this.searchForm.reset();
    this.filterForm.reset();
    this.searchResults = [];
  }
}
