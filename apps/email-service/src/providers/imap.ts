import Imap from 'imap';
import { simpleParser } from 'mailparser';
import type { EmailProvider, NormalizedEmail, MailboxConfig } from '../types';

export class ImapProvider implements EmailProvider {
  private config: MailboxConfig;
  private imapConfig: Imap.Config;

  constructor(mailbox: MailboxConfig) {
    this.config = mailbox;
    
    const settings = (mailbox.settings as any) || {};
    
    this.imapConfig = {
      user: mailbox.email,
      password: mailbox.accessToken, // For IMAP, accessToken is the password
      host: settings.host || this.getDefaultHost(mailbox.provider),
      port: settings.port || 993,
      tls: settings.useSsl !== false,
      tlsOptions: { rejectUnauthorized: false },
    };
  }

  private getDefaultHost(provider: string): string {
    const hosts: Record<string, string> = {
      YAHOO: 'imap.mail.yahoo.com',
      IMAP: 'imap.mail.yahoo.com', // Default fallback
    };
    return hosts[provider] || 'localhost';
  }

  async fetchEmails(fullSync = false): Promise<NormalizedEmail[]> {
    return new Promise((resolve, reject) => {
      const emails: NormalizedEmail[] = [];
      const imap = new Imap(this.imapConfig);

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          // Fetch recent emails
          const fetchCount = fullSync ? 100 : 50;
          const start = Math.max(1, box.messages.total - fetchCount + 1);
          const range = `${start}:*`;

          const fetch = imap.seq.fetch(range, {
            bodies: '',
            struct: true,
          });

          fetch.on('message', (msg, _seqno) => {
            let buffer = '';

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              msg.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  
                  const toAddresses = parsed.to;
                  const ccAddresses = parsed.cc;
                  
                  const email: NormalizedEmail = {
                    externalId: attrs.uid.toString(),
                    from: parsed.from?.value[0]?.address || '',
                    fromName: parsed.from?.value[0]?.name || '',
                    to: Array.isArray(toAddresses) 
                      ? toAddresses.flatMap(a => a.value?.map(v => v.address || '') || [])
                      : toAddresses?.value?.map((a: any) => a.address || '') || [],
                    cc: Array.isArray(ccAddresses)
                      ? ccAddresses.flatMap(a => a.value?.map(v => v.address || '') || [])
                      : ccAddresses?.value?.map((a: any) => a.address || '') || [],
                    subject: parsed.subject || '',
                    bodyText: parsed.text,
                    bodyHtml: parsed.html || undefined,
                    receivedAt: parsed.date || new Date(),
                    isRead: attrs.flags?.includes('\\Seen') || false,
                    hasAttachments: (parsed.attachments?.length || 0) > 0,
                    attachments: parsed.attachments?.map((att) => ({
                      filename: att.filename || 'attachment',
                      mimeType: att.contentType,
                      size: att.size,
                      contentId: att.contentId,
                    })),
                    headers: Object.fromEntries(
                      Array.from(parsed.headers.entries()).map(([k, v]) => [k, String(v)])
                    ),
                  };

                  emails.push(email);
                } catch (parseError) {
                  console.error('Failed to parse email:', parseError);
                }
              });
            });
          });

          fetch.once('error', (fetchErr) => {
            imap.end();
            reject(fetchErr);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails);
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }

  async applyLabel(emailId: string, label: string): Promise<void> {
    // IMAP doesn't support labels like Gmail
    // We can add flags or move to folders instead
    console.log(`IMAP: Cannot apply label ${label} to ${emailId} - not supported`);
  }

  async moveToFolder(emailId: string, folder: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.imapConfig);

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          imap.move(emailId, folder, (moveErr) => {
            imap.end();
            if (moveErr) {
              reject(moveErr);
            } else {
              resolve();
            }
          });
        });
      });

      imap.once('error', (err: Error) => {
        reject(err);
      });

      imap.connect();
    });
  }
}
