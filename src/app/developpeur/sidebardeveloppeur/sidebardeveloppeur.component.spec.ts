import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebardeveloppeurComponent } from './sidebardeveloppeur.component';

describe('SidebardeveloppeurComponent', () => {
  let component: SidebardeveloppeurComponent;
  let fixture: ComponentFixture<SidebardeveloppeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebardeveloppeurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebardeveloppeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
