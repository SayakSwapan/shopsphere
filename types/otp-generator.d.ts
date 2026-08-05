declare module "otp-generator" {
  interface GenerateOptions {
    upperCaseAlphabets?: boolean;
    lowerCaseAlphabets?: boolean;
    specialChars?: boolean;
    digits?: boolean;
  }

  const otpGenerator: {
    generate(
      length: number,
      options?: GenerateOptions
    ): string;
  };

  export default otpGenerator;
}