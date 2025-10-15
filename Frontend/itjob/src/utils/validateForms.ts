// @ts-ignore
import JustValidate from 'just-validate';

export function setupLoginValidation(formId: string) {
  const validator = new JustValidate(formId);

  validator
    .addField('#email', [
      { rule: 'required', errorMessage: 'Vui lòng nhập email của bạn!' },
      { rule: 'email', errorMessage: 'Email không đúng định dạng' },
    ])
    .addField('#password', [
      { rule: 'required', errorMessage: 'Vui lòng nhập mật khẩu của bạn!' },
      { rule: 'minLength', value: 8, errorMessage: 'Ít nhất 8 ký tự!' },
      {
        validator: (value) => /[A-Z]/.test(value),
        errorMessage: 'Phải có chữ hoa!',
      },
      {
        validator: (value) => /[a-z]/.test(value),
        errorMessage: 'Phải có chữ thường!',
      },
      {
        validator: (value) => /[0-9]/.test(value),
        errorMessage: 'Phải có chữ số!',
      },
      {
        validator: (value) => /[^A-Za-z0-9]/.test(value),
        errorMessage: 'Phải có ký tự đặc biệt!',
      },
    ])
    .onSuccess((event) => {
      const email = event.target.email.value;
      const password = event.target.password.value;
      console.log('Login:', { email, password });
    });
}

export function setupRegisterValidation(formId: string) {
  const validator = new JustValidate(formId);

  validator
    .addField('#fullName', [
      { rule: 'required', errorMessage: 'Vui lòng nhập họ tên!' },
      { rule: 'minLength', value: 5, errorMessage: 'Ít nhất 5 ký tự!' },
      { rule: 'maxLength', value: 50, errorMessage: 'Không quá 50 ký tự!' },
    ])
    .addField('#email', [
      { rule: 'required', errorMessage: 'Vui lòng nhập email!' },
      { rule: 'email', errorMessage: 'Email không đúng định dạng' },
    ])
    .addField('#password', [
      { rule: 'required', errorMessage: 'Vui lòng nhập mật khẩu!' },
      { rule: 'minLength', value: 8, errorMessage: 'Ít nhất 8 ký tự!' },
      {
        validator: (value) => /[A-Z]/.test(value),
        errorMessage: 'Phải có chữ hoa!',
      },
      {
        validator: (value) => /[a-z]/.test(value),
        errorMessage: 'Phải có chữ thường!',
      },
      {
        validator: (value) => /[0-9]/.test(value),
        errorMessage: 'Phải có chữ số!',
      },
      {
        validator: (value) => /[^A-Za-z0-9]/.test(value),
        errorMessage: 'Phải có ký tự đặc biệt!',
      },
    ])
    .onSuccess((event) => {
      const fullName = event.target.fullName.value;
      const email = event.target.email.value;
      const password = event.target.password.value;
      console.log('Register:', { fullName, email, password });
    });
}
