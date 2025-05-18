import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoutRegisterComponent } from './scout-register.component';

describe('ScoutRegisterComponent', () => {
  let component: ScoutRegisterComponent;
  let fixture: ComponentFixture<ScoutRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoutRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoutRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
