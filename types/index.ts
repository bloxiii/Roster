export type Agent = {
  id: string;
  role: string;
  description: string;
  skills: string[];
};

export type UseCase = {
  company: string;
  challenge: string;
  solution: string;
  result: string;
};

export type Stat = {
  value: string;
  label: string;
};

export type ContactFormValues = {
  name: string;
  email: string;
  company: string;
  message: string;
};
