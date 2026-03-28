export type CustomerProfile = {
  userId: string;
  email: string;
  name: string | null;
  country: string | null;
  phone: string | null;
  company: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateCustomerProfilePayload = {
  name: string;
  country: string;
  phone: string;
  company?: string | null;
};

export type CustomerProfileDashboardResponse = {
  user: {
    id: string;
    email: string;
    emailVerifiedAt: string | null;
  };
  profile: CustomerProfile;
};
