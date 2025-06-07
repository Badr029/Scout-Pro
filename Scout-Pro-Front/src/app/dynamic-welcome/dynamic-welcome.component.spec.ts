import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DynamicWelcomeComponent } from './dynamic-welcome.component';

describe('DynamicWelcomeComponent', () => {
  let component: DynamicWelcomeComponent;
  let fixture: ComponentFixture<DynamicWelcomeComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DynamicWelcomeComponent, BrowserAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicWelcomeComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to register', () => {
    component.navigateToRegister();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should navigate to login', () => {
    component.navigateToLogin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should start slideshow on init', () => {
    spyOn(component, 'startSlideshow');
    component.ngOnInit();
    expect(component.startSlideshow).toHaveBeenCalled();
  });

  it('should handle slide navigation', () => {
    component.goToSlide(2);
    expect(component.currentSlide).toBe(2);
  });
});
