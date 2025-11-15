import type { ValidationRule, ValidationResult } from "../types"

export function validateEmpty(reason: string): ValidationRule {
  return (value: string): ValidationResult => {
      if (value.trim() === "") {
    return {
      status: false,
      reason: reason
    }
    } else return {
      status: true,
      reason: ""
    }
  }
}

export function validateEmptyList(reason: string): ValidationRule {
  return (value: Array<any>): ValidationResult => {
      if (value.length == 0) {
    return {
      status: false,
      reason: reason
    }
    } else return {
      status: true,
      reason: ""
    }
  }
}

export function validateLowerBound(bound: number, reason: string): ValidationRule {
  return (value: string): ValidationResult => {
    try {
      let valueNum = parseInt(value);
          if (valueNum <= bound) {
    return {
      status: false,
      reason: reason
    }
    } else return {
      status: true,
      reason: ""
    }
    } catch (error: any) {
      return {
        status: false,
        reason: error.message,
      }
    }
  }
}

export function validateUpperBound(bound: number, reason: string): ValidationRule {
  return (value: string): ValidationResult => {
    try {
      const valueNum = parseInt(value);
    if (valueNum >= bound) {
    return {
      status: false,
      reason: reason
    }
    } else return {
      status: true,
      reason: ""
    }
  } catch (error: any) {
    return {
      status: false,
      reason: error.message
    }
  }
}
}

export const validateEmail =  (email: string): ValidationResult => {
  if (!/.+@.+\..+/.test(email)) {
    return {
      status: false,
      reason: "Email không đúng định dạng!"
    }
  } else {
    return {
      status: true,
      reason: ""
    }
  }
}

export const validatePassword = (password: string): ValidationResult => {
  const regex = new RegExp("^"+ // Check for the start of the string
    "(?=.*[a-z])"+              // Check for any lowercase letters
    "(?=.*[A-Z])"+              // Check for any uppercase letters
    "(?=.*\\d)"+                 // Check for any numbers
    "(?=.*[\\W_])"+              // Check for special characters (not a number or a letter)
    ".{8,}"+                    // Check if password length > 8
    "$"                         // Check until the end of the string
  )
  if (!regex.test(password)) {
    return {
      status: false,
      reason: "Mật khẩu phải có ít nhắt 8 kí tự, bao gồm 1 chữ cái hoa, 1 chữ cái thường, 1 chữ số và 1 kí tự đặc biệt!"
    }
  } else return {
    status: true,
    reason: ""
  }
}

export function validate(value: string, rules: ValidationRule[]): ValidationResult {
  for (const rule of rules) {
    let result = rule(value);

    if (!result.status) {
      return result
    }
  }
  return {
    status: true,
    reason: ""
  }
}