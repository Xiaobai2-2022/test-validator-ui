export interface LoginDTO {
    loginUser: string;
    password: string;
}

export interface RegisterDTO {
    username: string;
    password: string;
    displayName: string;
    email: string;
    verificationCode: string;
    userType: string;
}

export interface RegisterFrontEndDTO {
    username: string;
    password: string;
    passwordConfirmation: string;
    displayName: string;
    email: string;
    verificationCode: string;
    userType: string;
}
