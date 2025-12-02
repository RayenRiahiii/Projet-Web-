import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TachesdeveloppeurComponent } from './tachesdeveloppeur.component';

describe('TachesdeveloppeurComponent', () => {
  let component: TachesdeveloppeurComponent;
  let fixture: ComponentFixture<TachesdeveloppeurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TachesdeveloppeurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TachesdeveloppeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
