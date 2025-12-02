import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackmanagerComponent } from './feedbackmanager.component';

describe('FeedbackmanagerComponent', () => {
  let component: FeedbackmanagerComponent;
  let fixture: ComponentFixture<FeedbackmanagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackmanagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackmanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
