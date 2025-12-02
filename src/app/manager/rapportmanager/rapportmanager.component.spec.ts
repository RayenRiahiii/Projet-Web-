import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportmanagerComponent } from './rapportmanager.component';

describe('RapportmanagerComponent', () => {
  let component: RapportmanagerComponent;
  let fixture: ComponentFixture<RapportmanagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportmanagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportmanagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
