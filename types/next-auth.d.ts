import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id:            string;
    businessId:    string;
    role:          string;
    onboardingDone: boolean;
  }
  interface Session {
    user: {
      id:            string;
      name:          string;
      email:         string;
      businessId:    string;
      role:          string;
      onboardingDone: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:            string;
    businessId:    string;
    role:          string;
    onboardingDone: boolean;
  }
}
