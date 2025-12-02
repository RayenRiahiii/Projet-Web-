import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackdeveloppeurComponent } from './feedbackdeveloppeur.component';

describe('FeedbackdeveloppeurComponent', () => {
  let component: FeedbackdeveloppeurComponent;
  let fixture: ComponentFixture<FeedbackdeveloppeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackdeveloppeurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackdeveloppeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
