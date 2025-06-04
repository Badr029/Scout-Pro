import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoutSubscriptionComponent } from './scout-subscription.component';

describe('ScoutSubscriptionComponent', () => {
  let component: ScoutSubscriptionComponent;
  let fixture: ComponentFixture<ScoutSubscriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoutSubscriptionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoutSubscriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
