import { Component, Inject, ElementRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment'; // adjust path if needed

export interface MainSurgeryDialogData {
  CaseNumber: string;
  PatientName: string;
  SurgeryDate?: string | Date;
  Department?: string;
  DRG?: string;
  ICD9?: string;
  DiagCode?: string;
  SURGERY_NAME?: string;
  SurgeryRunk?: string;
  DoingText?: string;
  MainSurgeonNameFirst1?: string;
  MainSurgeonNameLast1?: string;
  MainSurgeonEmail1?: string;
  MainSurgeonCell1?: string;
  MainSurgeonNameFirst2?: string;
  MainSurgeonNameLast2?: string;
  MainSurgeonEmail2?: string;
  MainSurgeonCell2?: string;
  RegistrarBillingRecommendation?: string;
  RegistrarComments?: string;
  RegistrarRequestForReportCorrection?: string;
  CommentId?: number | null;
  CommentDate?: string | Date | null;
}

@Component({
  selector: 'app-main-surgery-dialog',
  templateUrl: './main-surgery-dialog.component.html',
  styleUrls: ['./main-surgery-dialog.component.scss']
})
export class MainSurgeryDialogComponent {
  // the hidden printable area in your HTML
  @ViewChild('pdfContent', { static: false }) pdfContent!: ElementRef<HTMLDivElement>;
  existing = false;

  constructor(
    public dialogRef: MatDialogRef<MainSurgeryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MainSurgeryDialogData,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.commentForm = this.fb.group({
      SystemName: ['MainSurgery'],
      CaseNumber: [this.data?.CaseNumber || ''],
      RegistrarBillingRecommendation: [this.data?.RegistrarBillingRecommendation || ''],
      RegistrarComments: [this.data?.RegistrarComments || ''],
      RegistrarRequestForReportCorrection: [this.data?.RegistrarRequestForReportCorrection || ''],
      EntryUser: '',
      Date: [
        this.data?.CommentDate
          ? new Date(this.data.CommentDate)
          : (this.data?.SurgeryDate ? new Date(this.data.SurgeryDate) : null)
      ]
    });
  
    this.existing = !!(
      (this.data?.RegistrarBillingRecommendation && this.data.RegistrarBillingRecommendation.trim().length) ||
      (this.data?.RegistrarComments && this.data.RegistrarComments.trim().length) ||
      (this.data?.RegistrarRequestForReportCorrection && this.data.RegistrarRequestForReportCorrection.trim().length) ||
      this.data?.CommentDate
    );
  }

  private toSqlLocal(d: string | Date, setToMidnight = true): string {
    const x = new Date(d);
    if (setToMidnight) x.setHours(0, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T` +
           `${pad(x.getHours())}:${pad(x.getMinutes())}:${pad(x.getSeconds())}`;
  }

  private pickBaseDate(): Date | null {
    const raw = this.commentForm?.value;
    const candidates: Array<string | Date | null | undefined> = [
      this.data?.CommentDate,          // if row already had a saved comment date
      raw?.Date,                       // form control (if user edited)
      this.data?.SurgeryDate           // fallback from main row
    ];
  
    for (const c of candidates) {
      if (!c) continue;
      const d = new Date(c);
      if (!isNaN(d.getTime())) {
        // normalize to midnight local if you want date-only uniqueness
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    return null;
  }
  
  saveComment() {
    if (this.commentForm.invalid) return;
    this.saving = true;
  
    const raw = this.commentForm.value;
    const baseDateObj = this.pickBaseDate();
  
    if (!baseDateObj) {
      this.saving = false;
      console.error('No date found. Debug:', {
        formDate: raw?.Date,
        commentDate: this.data?.CommentDate,
        surgeryDate: this.data?.SurgeryDate
      });
      alert('לא נמצא תאריך ניתוח/הערה לשמירה (בדוק שהשורה כוללת SurgeryDate).');
      return;
    }
  
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateSqlLocal =
      `${baseDateObj.getFullYear()}-${pad(baseDateObj.getMonth()+1)}-${pad(baseDateObj.getDate())}` +
      `T${pad(baseDateObj.getHours())}:${pad(baseDateObj.getMinutes())}:${pad(baseDateObj.getSeconds())}`;
  
    const payload = { ...raw, Date: dateSqlLocal };
  
    const req$ = this.existing
      ? this.http.put(`${environment.apiUrl}MainSurgery/Comments`, payload)
      : this.http.post(`${environment.apiUrl}MainSurgery/Comments`, payload);
  
    req$.subscribe({
      next: () => this.dialogRef.close({ updated: true }),
      error: (err) => {
        if (err?.status === 409) {
          this.http.put(`${environment.apiUrl}MainSurgery/Comments`, payload)
            .subscribe({
              next: () => this.dialogRef.close({ updated: true }),
              error: e2 => { console.error(e2); this.saving = false; alert('Update failed'); }
            });
        } else {
          console.error(err);
          this.saving = false;
          alert(err?.error || 'Save failed');
        }
      }
    });
  }
  
  close() { this.dialogRef.close(); }
  commentForm: FormGroup;
  saving = false;
  get emails(): string[] {
    return Array.from(new Set(
      [(this.data.MainSurgeonEmail1 || '').trim(),
       (this.data.MainSurgeonEmail2 || '').trim()]
       .filter(Boolean)
    ));
  }

  fmtDate(v: any): string {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(+d)) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  private buildEmailBody(): string {
    const name1 = `${this.data.MainSurgeonNameFirst1 || ''} ${this.data.MainSurgeonNameLast1 || ''}`.trim();
    const name2 = `${this.data.MainSurgeonNameFirst2 || ''} ${this.data.MainSurgeonNameLast2 || ''}`.trim();
    const doing = (this.data.DoingText || '').replace(/\r\n/g, '\n').trim();

    const lines = [
      `מספר תיק: ${this.data.CaseNumber || ''}`,
      `שם מטופל: ${this.data.PatientName || ''}`,
      `תאריך ניתוח: ${this.fmtDate(this.data.SurgeryDate)}`,
      `מחלקה: ${this.data.Department || ''}`,
      `DRG: ${this.data.DRG || ''}`,
      `ICD9: ${this.data.ICD9 || ''}`,
      `שם ניתוח: ${this.data.SURGERY_NAME || ''}`,
      `דירוג ניתוח: ${this.data.SurgeryRunk || ''}`,
      '',
      `מנתח 1: ${name1 || '—'}`,
      `אימייל מנתח 1: ${(this.data.MainSurgeonEmail1 || '').trim() || '—'}`,
      `נייד מנתח 1: ${(this.data.MainSurgeonCell1 || '').trim() || '—'}`,
      '',
      `מנתח 2: ${name2 || '—'}`,
      `אימייל מנתח 2: ${(this.data.MainSurgeonEmail2 || '').trim() || '—'}`,
      `נייד מנתח 2: ${(this.data.MainSurgeonCell2 || '').trim() || '—'}`,
      '',
      'סיכום/דוח פעולה:',
      doing || '—'
    ];
    return lines.join('\n');
  }

  async openOutlook() {
    if (this.emails.length === 0) return;
    const to = this.emails.join(',');
    const subject = `דו"ח ניתוח - ${this.data.CaseNumber || ''} - ${this.data.PatientName || ''}`.trim();
    const bodyFull = this.buildEmailBody();

    const hrefFull = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyFull)}`;
    if (hrefFull.length <= 1800) {
      window.location.href = hrefFull;
      return;
    }
    const hrefShort = `mailto:${to}?subject=${encodeURIComponent(subject)}`;
    try {
      await navigator.clipboard.writeText(bodyFull);
      alert('התוכן המלא הועתק ללוח. הדבק (Ctrl+V) בגוף המייל ב-Outlook.');
    } catch {
      alert('התוכן גדול מדי ל־mailto. Outlook ייפתח בלי גוף; נא להדביק ידנית.');
    }
    window.location.href = hrefShort;
  }

  // ---------- HTML ➜ Canvas ➜ PDF (Hebrew-safe) ----------
  private async generatePdfBlob(): Promise<Blob> {
    const el = this.pdfContent?.nativeElement;
    if (!el) throw new Error('pdfContent element not found');

    // html2canvas keeps RTL, fonts, and newlines as rendered in the hidden HTML
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgW = pdfW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pdfH;

    while (heightLeft > 0) {
      position = heightLeft - imgH; // negative y to continue the long image
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pdfH;
    }

    return pdf.output('blob');
  }

  // Optional: allow user to just download the PDF
  async downloadPdfFromHtml() {
    const blob = await this.generatePdfBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surgery_${this.data.CaseNumber || 'Details'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
  // -------------------------------------------------------

  private buildEmlWithAttachment(
    toCsv: string,
    subject: string,
    bodyText: string,
    filename: string,
    pdfBase64: string
  ): string {
    const boundary = '----=_NextPart_' + Math.random().toString(36).slice(2);
    const wrap76 = (b64: string) => b64.replace(/(.{1,76})/g, '$1\r\n');

    const headers =
      `From: noreply@example.com\r\n` +
      `To: ${toCsv}\r\n` +
      `Date: ${new Date().toUTCString()}\r\n` +
      `Subject: ${subject}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;

    const preamble = `This is a multi-part message in MIME format.\r\n`;

    const partText =
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset=UTF-8\r\n` +
      `Content-Transfer-Encoding: 8bit\r\n\r\n` +
      bodyText.replace(/\n/g, '\r\n') + `\r\n`;

    const partAttachment =
      `--${boundary}\r\n` +
      `Content-Type: application/pdf; name="${filename}"\r\n` +
      `Content-Transfer-Encoding: base64\r\n` +
      `Content-Disposition: attachment; filename="${filename}"\r\n\r\n` +
      wrap76(pdfBase64) + `\r\n` +
      `--${boundary}--\r\n`;

    return `${headers}\r\n${preamble}\r\n${partText}${partAttachment}`;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Create .eml with the PDF attached
// Create .eml with just the body (no PDF)
  
// Replace your downloadEmlWithPdf() with this:
// Always create an .eml draft with full body (no mailto, no copy/paste)
sendEmail() {
  if (this.emails.length === 0) return;

  const to = this.emails.join(',');
  const subject = `דו"ח ניתוח - ${this.data.CaseNumber || ''} - ${this.data.PatientName || ''}`.trim();
  const body = this.buildEmailBody().replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'); // CRLF

  const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Outlook/Windows often fails around ~1800–2000 chars
  if (href.length <= 1800) {
    window.location.href = href;  // opens with body inline
    return;
  }

  // Fallback: full body via .eml (no copy/paste)
  const eml = this.buildPlainEml(to, subject, body);
  const blob = new Blob([eml], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${this.data.CaseNumber || 'message'}.eml`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


private buildPlainEml(toCsv: string, subject: string, bodyText: string): string {
  const headers =
    `From: noreply@example.com\r\n` +
    `To: ${toCsv}\r\n` +
    `Date: ${new Date().toUTCString()}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: text/plain; charset=UTF-8\r\n` +
    `Content-Transfer-Encoding: 8bit\r\n\r\n`;

  return headers + bodyText.replace(/\n/g, '\r\n');
}



}
