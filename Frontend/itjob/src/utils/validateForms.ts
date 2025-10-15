export function validateEmailChecker(email: string) {
  if (email.trim() == "") {
    return {
      status: false,
      reason: "Vui lòng nhập email của bạn!",
    }
  } else if (!/.+@.+\..+/.test(email)) {
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

export function validatePasswordChecker(password: string) {
  if (password.trim() == "") {
    return {
      status: false,
      reason: "Vui lòng nhập mật khẩu của bạn!"
    }
  } else if (
    password.length < 8 ||      // Password has less than 8 characters
    !/[A-Z]/.test(password) ||  // Password has no uppercase letters
    !/[a-z]/.test(password) ||  // Password has no lowercase letters
    !/[0-9]/.test(password) ||  // Password has no numbers
    !/[^\w\s]/.test(password)   // Password has no special character (not a word or a whitespace)
  ) {
    return {
      status: false,
      reason: "Mật khẩu phải có ít nhắt 8 kí tự, bao gồm 1 chữ cái hoa, 1 chữ cái thường, 1 chữ số và 1 kí tự đặc biệt!"
    }
  } else return {
    status: true,
    reason: ""
  }
}

export function validateNameChecker(name: string) {
  if (name.trim() == "") {
    return {
      status: false,
      reason: "Vui lòng nhập họ tên của bạn!"
    }
  } else return {
    status: true,
    reason: ""
  }
}