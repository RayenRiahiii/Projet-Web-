import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RisqueprojetComponent } from './risqueprojet.component';

describe('RisqueprojetComponent', () => {
  let component: RisqueprojetComponent;
  let fixture: ComponentFixture<RisqueprojetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RisqueprojetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RisqueprojetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
