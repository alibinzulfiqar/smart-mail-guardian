export interface NormalizedEmail {
  externalId: string;
  threadId?: string;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  receivedAt: Date;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: NormalizedAttachment[];
  headers?: Record<string, string>;
  labels?: string[];
}

export interface NormalizedAttachment {
  filename: string;
  mimeType: string;
  size: number;
  contentId?: string;
}

export interface EmailProvider {
  fetchEmails(fullSync?: boolean): Promise<NormalizedEmail[]>;
  applyLabel(emailId: string, label: string): Promise<void>;
  moveToFolder(emailId: string, folder: string): Promise<void>;
}

export interface MailboxConfig {
  id: string;
  provider: string;
  email: string;
  accessToken: string;
  refreshToken?: string | null;
  settings?: Record<string, any>;
}
