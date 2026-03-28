export type EmailMessagePayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
};

export type EmailModuleConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from?: string;
};

