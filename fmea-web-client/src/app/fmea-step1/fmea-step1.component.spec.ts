import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FmeaStep1Component } from './fmea-step1.component';

describe('FmeaStep1Component', () => {
  let component: FmeaStep1Component;
  let fixture: ComponentFixture<FmeaStep1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FmeaStep1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FmeaStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
