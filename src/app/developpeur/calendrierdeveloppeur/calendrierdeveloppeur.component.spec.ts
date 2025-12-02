import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendrierdeveloppeurComponent } from './calendrierdeveloppeur.component';

describe('CalendrierdeveloppeurComponent', () => {
  let component: CalendrierdeveloppeurComponent;
  let fixture: ComponentFixture<CalendrierdeveloppeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendrierdeveloppeurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendrierdeveloppeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
