export type ContactLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  interest: string | null;
  message: string;
  createdAt: string;
};

export type SubmitContactLeadPayload = {
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  interest?: string | null;
  message: string;
  locale?: string;
};
