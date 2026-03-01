import { Injectable, signal } from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MechanicTemplate } from '../models/character.model';

@Injectable({
  providedIn: 'root',
})
export class ValidationService {

  validateMechanicTemplate(template: any): template is MechanicTemplate {
    return (
      template &&
      typeof template.setting_context === 'string' &&
      typeof template.mechanic_template === 'string' &&
      typeof template.roll_formula === 'string' &&
      typeof template.diceType === 'string' &&
      typeof template.statPointPool === 'number' &&
      Array.isArray(template.stats) &&
      Array.isArray(template.skills)
    );
  }
  
  /**
   * Creates a validator function for a point-buy system in a FormGroup.
   * @param pointPool The total number of points available.
   * @returns An Angular ValidatorFn.
   */
  createStatAllocationValidator(pointPool: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!(control instanceof FormGroup)) {
        return null;
      }
      const formGroup = control as FormGroup;
      const totalPointsSpent = Object.keys(formGroup.controls).reduce((acc, key) => {
        const statValue = formGroup.get(key)?.value || 8;
        return acc + this.getPointCostForStat(statValue);
      }, 0);
      
      const remainingPoints = pointPool - totalPointsSpent;

      if (remainingPoints !== 0) {
        return { pointsRemaining: { required: 0, actual: remainingPoints } };
      }

      return null; 
    };
  }

  /**
   * Calculates the total point-buy cost for a given stat value.
   * Assumes a base stat of 8 costs 0 points.
   */
  private getPointCostForStat(value: number): number {
    let cost = 0;
    for (let i = 9; i <= value; i++) {
      if (i <= 13) {
        cost += 1;
      } else if (i <= 15) {
        cost += 2;
      } else {
        cost += 3; // Cost increases for higher stats
      }
    }
    return cost;
  }
}
