import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoutViewComponent } from './scout-view.component';

describe('ScoutViewComponent', () => {
  let component: ScoutViewComponent;
  let fixture: ComponentFixture<ScoutViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoutViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoutViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});