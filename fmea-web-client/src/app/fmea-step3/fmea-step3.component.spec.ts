import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FmeaStep3Component } from './fmea-step3.component';

describe('FmeaStep3Component', () => {
  let component: FmeaStep3Component;
  let fixture: ComponentFixture<FmeaStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FmeaStep3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FmeaStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
