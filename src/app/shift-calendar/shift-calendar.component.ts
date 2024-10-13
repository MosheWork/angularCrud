import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

interface Shift {
  employeeName: string;
  shiftTime: string;
}

@Component({
  selector: 'app-shift-calendar',
  templateUrl: './shift-calendar.component.html',
  styleUrls: ['./shift-calendar.component.scss']
})
export class ShiftCalendarComponent {
  selectedDate: Date | null = new Date(); // Allow null
  selectedShifts: Shift[] = [];
  shifts: { [key: string]: Shift[] } = {};
  shiftForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.shiftForm = this.fb.group({
      employeeName: [''],
      shiftTime: ['']
    });
  }

  // Add a shift for the selected date
  addShiftToDate() {
    const employeeName = this.shiftForm.get('employeeName')?.value;
    const shiftTime = this.shiftForm.get('shiftTime')?.value;

    if (employeeName && shiftTime && this.selectedDate) {
      const shift: Shift = {
        employeeName,
        shiftTime
      };
      const dateKey = this.selectedDate.toDateString();
      if (!this.shifts[dateKey]) {
        this.shifts[dateKey] = [];
      }
      this.shifts[dateKey].push(shift);
    }
  }

  // Get shifts for a specific date
  getShiftsForDate(date: Date): Shift[] {
    return this.shifts[date.toDateString()] || [];
  }

  // When a date is selected
  onDateSelected(date: Date | null) {
    if (date) {
      this.selectedDate = date;
      this.selectedShifts = this.getShiftsForDate(date);
    }
  }

  // Highlight dates with shifts
  dateClass = (date: Date): string => {
    const dateKey = date.toDateString();
    return this.shifts[dateKey] ? 'has-shift' : '';
  };
}
