import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoutEditComponent } from './scout-edit.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('ScoutEditComponent', () => {
  let component: ScoutEditComponent;
  let fixture: ComponentFixture<ScoutEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ScoutEditComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScoutEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});