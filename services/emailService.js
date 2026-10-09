const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return entities[character];
  });

const sendContactReplyEmail = async ({
  to,
  customerName,
  subject,
  message,
}) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to,
    subject: `Góc Nhỏ Coffee - Phản hồi: ${subject}`,
    html: `
      <div style="
        max-width: 650px;
        margin: 0 auto;
        font-family: Arial, sans-serif;
        color: #333;
        line-height: 1.6;
      ">
        <div style="
          background: #6f4e37;
          color: white;
          padding: 25px;
          text-align: center;
        ">
          <h1 style="margin: 0;">☕ Góc Nhỏ Coffee</h1>
          <p style="margin: 8px 0 0;">
            Phản hồi yêu cầu của khách hàng
          </p>
        </div>

        <div style="padding: 25px;">
          <p>Xin chào <strong>${escapeHtml(customerName)}</strong>,</p>

          <p>
            Cảm ơn bạn đã liên hệ với <strong>Góc Nhỏ Coffee</strong>.
          </p>

          <div style="
            background: #f7f3ef;
            border-left: 4px solid #6f4e37;
            padding: 15px;
            margin: 20px 0;
          ">
            <strong>Tiêu đề:</strong>
            <p style="margin: 8px 0 0;">
              ${escapeHtml(subject)}
            </p>
          </div>

          <p><strong>Nội dung phản hồi:</strong></p>

          <div style="
            background: #fafafa;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 18px;
            white-space: pre-line;
          ">
            ${escapeHtml(message)}
          </div>

          <p style="margin-top: 25px;">
            Nếu bạn cần hỗ trợ thêm, hãy liên hệ lại với chúng tôi.
          </p>

          <p>
            Trân trọng,<br />
            <strong>Góc Nhỏ Coffee</strong>
          </p>
        </div>

        <div style="
          background: #f3f3f3;
          padding: 15px;
          text-align: center;
          color: #777;
          font-size: 13px;
        ">
          Email này được gửi tự động từ hệ thống Góc Nhỏ Coffee.
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendContactReplyEmail,
};
