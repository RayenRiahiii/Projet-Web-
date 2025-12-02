import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportadminComponent } from './rapportadmin.component';

describe('RapportadminComponent', () => {
  let component: RapportadminComponent;
  let fixture: ComponentFixture<RapportadminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportadminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportadminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
