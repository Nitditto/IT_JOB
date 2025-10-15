// login form 
const loginForm = document.querySelector("#login-form")
if (loginForm) {
    const validator = new JustValidate('#login-form');

    validator
        .addField('#email', [
            {
                rule: 'required',
                errorMessage: "Vui lòng nhập email của bạn!",
            },
            {
                rule: 'email',
                errorMessage: "Email không đúng định dạng",
            },
        ])
        .addField("#password", [
            {
                rule: "required",
                errorMessage: "Vui lòng nhập mật khẩu của bạn!"
            },
            {
                rule: "minLength",
                value: 8,
                errorMessage: "Mật khẩu phải chứa ít nhất 8 ký tự!"
            },
            {
                validator: (value) => {
                    const regex = /[A-Z]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự viết hoa!"
            },
            {
                validator: (value) => {
                    const regex = /[a-z]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự viết thường!"
            },
            {
                validator: (value) => {
                    const regex = /[0-9]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa chữ số!"
            },
            {
                validator: (value) => {
                    const regex = /[^A-Za-z0-9]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự đặc biệt!"
            },
        ])
        .onSuccess((event) => {
            const email = event.target.email.value;
            const password = event.target.password.value;
            const rememberPassword=event.target.rememberPassword.checked;
            console.log(email);
            console.log(password);
            console.log(rememberPassword);
        });



}
//End login form 


// register form 
const registerForm = document.querySelector("#register-form")
if (registerForm) {
    const validator = new JustValidate('#register-form');

    validator
        .addField('#fullName', [
            {
                rule: 'required',
                errorMessage: "Vui lòng nhập họ tên!",
            },
            {
                rule: "minLength",
                value: 5,
                errorMessage: "Họ tên phải chứa ít nhất 5 kí tự!"
            },
            {
                rule: "maxLength",
                value: 50,
                errorMessage: "Họ tên không được vướt quá 50 kí tự!"
            },
        ])
        .addField('#email', [
            {
                rule: 'required',
                errorMessage: "Vui lòng nhập email của bạn!",
            },
            {
                rule: 'email',
                errorMessage: "Email không đúng định dạng",
            },
        ])
        .addField("#password", [
            {
                rule: "required",
                errorMessage: "Vui lòng nhập mật khẩu của bạn!"
            },
            {
                rule: "minLength",
                value: 8,
                errorMessage: "Mật khẩu phải chứa ít nhất 8 ký tự!"
            },
            {
                validator: (value) => {
                    const regex = /[A-Z]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự viết hoa!"
            },
            {
                validator: (value) => {
                    const regex = /[a-z]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự viết thường!"
            },
            {
                validator: (value) => {
                    const regex = /[0-9]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa chữ số!"
            },
            {
                validator: (value) => {
                    const regex = /[^A-Za-z0-9]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự đặc biệt!"
            },
        ])
        // .addField('#agree', [
        //     {
        //         rule: 'required',
        //         errorMessage: "Bạn phải đồng ý với các điều khoản và điều kiện!",
        //     },
        // ])
        .onSuccess((event) => {
            const fullName=event.target.fullName.value;
            const email = event.target.email.value;
            const password = event.target.password.value;
            console.log(fullName);
            console.log(email);
            console.log(password);
            // console.log(rememberPassword);
        });



}
//End register form 

// forgot password form 
const forgotPasswordForm = document.querySelector("#forgot-password-form")
if (forgotPasswordForm) {
    const validator = new JustValidate('#forgot-password-form');

    validator
        .addField('#email', [
            {
                rule: 'required',
                errorMessage: "Vui lòng nhập email của bạn!",
            },
            {
                rule: 'email',
                errorMessage: "Email không đúng định dạng",
            },
        ])
        
        .onSuccess((event) => {
            const email = event.target.email.value;
            console.log(email);
        });

}
//End forgot password form 


// otp password form 
const otpPasswordForm = document.querySelector("#otp-password-form")
if (otpPasswordForm) {
    const validator = new JustValidate('#otp-password-form');

    validator
        .addField('#otp', [
            {
                rule: 'required',
                errorMessage: "Vui lòng nhập mã otp của bạn!",
            },
        ])
        
        .onSuccess((event) => {
            const otp = event.target.otp.value;
            console.log(otp);
        });

}
//End otp password form 


// reset password form 
const resetPasswordForm = document.querySelector("#reset-password-form")
if (resetPasswordForm) {
    const validator = new JustValidate('#reset-password-form');

    validator
        .addField("#password", [
            {
                rule: "required",
                errorMessage: "Vui lòng nhập mật khẩu của bạn!"
            },
            {
                rule: "minLength",
                value: 8,
                errorMessage: "Mật khẩu phải chứa ít nhất 8 ký tự!"
            },
            {
                validator: (value) => {
                    const regex = /[A-Z]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự viết hoa!"
            },
            {
                validator: (value) => {
                    const regex = /[a-z]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự viết thường!"
            },
            {
                validator: (value) => {
                    const regex = /[0-9]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa chữ số!"
            },
            {
                validator: (value) => {
                    const regex = /[^A-Za-z0-9]/;
                    const result = regex.test(value);
                    return result;
                },
                errorMessage: "Mật khẩu phải chứa ký tự đặc biệt!"
            },
        ])
        .addField("#confirmPassword",[
            {
                rule: "required",
                errorMessage: "Vui lòng nhập xác nhận mật khẩu của bạn!"
            },
            {
                validator:(value,fields)=>{
                    const password=fields["#password"].elem.value;
                    return password==value;
                },
                errorMessage: "Mật khẩu xác nhận không khớp!"
            }
        ])
        .onSuccess((event) => {
            const email = event.target.email.value;
            const password = event.target.password.value;
            const rememberPassword=event.target.rememberPassword.checked;
            console.log(email);
            console.log(password);
            console.log(rememberPassword);
        });



}
//End reset password form 