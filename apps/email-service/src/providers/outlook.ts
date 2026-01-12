import { ConfidentialClientApplication } from '@azure/msal-node';
import axios from 'axios';
import type { EmailProvider, NormalizedEmail, MailboxConfig } from '../types';

export class OutlookProvider implements EmailProvider {
  private config: MailboxConfig;
  private accessToken: string;

  constructor(mailbox: MailboxConfig) {
    this.config = mailbox;
    this.accessToken = mailbox.accessToken;
  }

  private get graphUrl() {
    return 'https://graph.microsoft.com/v1.0';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async fetchEmails(fullSync = false): Promise<NormalizedEmail[]> {
    const emails: NormalizedEmail[] = [];

    try {
      const filter = fullSync ? '' : '&$filter=isRead eq false or receivedDateTime ge ' + 
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const response = await axios.get(
        `${this.graphUrl}/me/messages?$top=50&$orderby=receivedDateTime desc${filter}`,
        { headers: this.headers }
      );

      const messages = response.data.value || [];
      console.log(`📬 Outlook: Found ${messages.length} messages`);

      for (const msg of messages) {
        emails.push(this.normalizeEmail(msg));
      }
    } catch (error: any) {
      console.error('Outlook fetch error:', error.response?.data || error.message);
      throw error;
    }

    return emails;
  }

  private normalizeEmail(msg: any): NormalizedEmail {
    return {
      externalId: msg.id,
      threadId: msg.conversationId,
      from: msg.from?.emailAddress?.address || '',
      fromName: msg.from?.emailAddress?.name || '',
      to: msg.toRecipients?.map((r: any) => r.emailAddress?.address) || [],
      cc: msg.ccRecipients?.map((r: any) => r.emailAddress?.address) || [],
      bcc: msg.bccRecipients?.map((r: any) => r.emailAddress?.address) || [],
      subject: msg.subject || '',
      bodyText: msg.body?.contentType === 'text' ? msg.body?.content : undefined,
      bodyHtml: msg.body?.contentType === 'html' ? msg.body?.content : undefined,
      snippet: msg.bodyPreview,
      receivedAt: new Date(msg.receivedDateTime),
      isRead: msg.isRead || false,
      hasAttachments: msg.hasAttachments || false,
      attachments: [], // Fetch separately if needed
      headers: {
        'Message-ID': msg.internetMessageId,
      },
      labels: msg.categories || [],
    };
  }

  async applyLabel(emailId: string, label: string): Promise<void> {
    await axios.patch(
      `${this.graphUrl}/me/messages/${emailId}`,
      {
        categories: [label],
      },
      { headers: this.headers }
    );
  }

  async moveToFolder(emailId: string, folder: string): Promise<void> {
    const folderMap: Record<string, string> = {
      spam: 'junkemail',
      trash: 'deleteditems',
      inbox: 'inbox',
    };

    const destinationId = folderMap[folder.toLowerCase()] || folder;

    await axios.post(
      `${this.graphUrl}/me/messages/${emailId}/move`,
      { destinationId },
      { headers: this.headers }
    );
  }
}
