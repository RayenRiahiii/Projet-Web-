import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionProjetsComponent } from './gestion-projets.component';

describe('GestionProjetsComponent', () => {
  let component: GestionProjetsComponent;
  let fixture: ComponentFixture<GestionProjetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionProjetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionProjetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
