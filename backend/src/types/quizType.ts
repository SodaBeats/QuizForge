export enum Accessibility {
  anyone = 'anyone',
  restricted = 'restricted',
}

export enum Status {
  draft = 'draft',
  published = 'published',
}

export type Quiz = {
  user_id: number;
  quiz_title: string;
  quiz_description: string | null;
  share_token: string;
  accessibility: Accessibility;
  max_attempts: number;
  due_date: Date;
  status: Status;
};
