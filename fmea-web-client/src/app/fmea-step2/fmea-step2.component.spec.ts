import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FmeaStep2Component } from './fmea-step2.component';

describe('FmeaStep2Component', () => {
  let component: FmeaStep2Component;
  let fixture: ComponentFixture<FmeaStep2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FmeaStep2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FmeaStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
