import { google } from 'googleapis';
import type { EmailProvider, NormalizedEmail, MailboxConfig } from '../types';

export class GmailProvider implements EmailProvider {
  private gmail;
  private _config: MailboxConfig;

  constructor(mailbox: MailboxConfig) {
    this._config = mailbox;
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: mailbox.accessToken,
      refresh_token: mailbox.refreshToken || undefined,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async fetchEmails(fullSync = false): Promise<NormalizedEmail[]> {
    const emails: NormalizedEmail[] = [];
    
    try {
      // Fetch recent messages
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: fullSync ? 100 : 50,
        q: fullSync ? '' : 'is:unread OR newer_than:1d',
      });

      const messages = response.data.messages || [];
      console.log(`📬 Gmail: Found ${messages.length} messages`);

      for (const msg of messages.slice(0, 50)) {
        try {
          const email = await this.fetchEmailDetails(msg.id!);
          if (email) {
            emails.push(email);
          }
        } catch (error) {
          console.error(`Failed to fetch email ${msg.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Gmail fetch error:', error);
      throw error;
    }

    return emails;
  }

  private async fetchEmailDetails(messageId: string): Promise<NormalizedEmail | null> {
    const response = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    // Extract body
    let bodyText = '';
    let bodyHtml = '';

    const extractBody = (parts: any[]): void => {
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          extractBody(part.parts);
        }
      }
    };

    if (message.payload?.body?.data) {
      bodyText = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      extractBody(message.payload.parts);
    }

    // Extract attachments
    const attachments: any[] = [];
    const extractAttachments = (parts: any[]): void => {
      for (const part of parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
            contentId: part.headers?.find((h: any) => h.name === 'Content-ID')?.value,
          });
        }
        if (part.parts) {
          extractAttachments(part.parts);
        }
      }
    };

    if (message.payload?.parts) {
      extractAttachments(message.payload.parts);
    }

    return {
      externalId: message.id!,
      threadId: message.threadId || undefined,
      from: getHeader('from'),
      fromName: this.extractName(getHeader('from')),
      to: this.parseAddresses(getHeader('to')),
      cc: this.parseAddresses(getHeader('cc')),
      subject: getHeader('subject'),
      bodyText,
      bodyHtml,
      snippet: message.snippet || undefined,
      receivedAt: new Date(parseInt(message.internalDate || '0')),
      isRead: !message.labelIds?.includes('UNREAD'),
      hasAttachments: attachments.length > 0,
      attachments,
      headers: Object.fromEntries(headers.map((h) => [h.name!, h.value!])),
      labels: message.labelIds || [],
    };
  }

  private extractName(address: string): string {
    const match = address.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : '';
  }

  private parseAddresses(header: string): string[] {
    if (!header) return [];
    return header.split(',').map((addr) => addr.trim());
  }

  async applyLabel(emailId: string, label: string): Promise<void> {
    // First, ensure the label exists
    const labels = await this.gmail.users.labels.list({ userId: 'me' });
    let labelId = labels.data.labels?.find((l) => l.name === label)?.id;

    if (!labelId) {
      const newLabel = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: { name: label },
      });
      labelId = newLabel.data.id!;
    }

    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });
  }

  async moveToFolder(emailId: string, folder: string): Promise<void> {
    const folderMap: Record<string, string> = {
      spam: 'SPAM',
      trash: 'TRASH',
      inbox: 'INBOX',
    };

    const labelId = folderMap[folder.toLowerCase()];
    if (!labelId) {
      throw new Error(`Unknown folder: ${folder}`);
    }

    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: [labelId],
        removeLabelIds: labelId !== 'INBOX' ? ['INBOX'] : [],
      },
    });
  }
}
