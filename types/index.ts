export type Agent = {
  id: string;
  name: string;
  role: string;
  description: string;
  skills: string[];
  avatar: string;
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
