const { ContactMessage } = require('../models');
const { sendContactReplyEmail } = require('../services/emailService');

const createContactMessage = async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};

  const fields = {
    name: typeof name === 'string' ? name.trim() : '',
    email: typeof email === 'string' ? email.trim() : '',
    phone: typeof phone === 'string' ? phone.trim() : '',
    subject: typeof subject === 'string' ? subject.trim() : '',
    message: typeof message === 'string' ? message.trim() : '',
  };

  if (!fields.name || !fields.email || !fields.subject || !fields.message) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập đầy đủ họ tên, email, chủ đề và nội dung',
    });
  }

  if (
    fields.name.length > 100 ||
    fields.email.length > 150 ||
    fields.phone.length > 20 ||
    fields.subject.length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: 'Một hoặc nhiều thông tin vượt quá độ dài cho phép',
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    return res.status(400).json({
      success: false,
      message: 'Email không hợp lệ',
    });
  }

  try {
    const contactMessage = await ContactMessage.create({
      ...fields,
      phone: fields.phone || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Gửi tin nhắn thành công',
      data: {
        id: contactMessage.id,
        status: contactMessage.status,
        created_at: contactMessage.created_at,
      },
    });
  } catch (error) {
    console.error('Create contact message error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn lúc này',
    });
  }
};

const getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.findAll({
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Get contact messages error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách tin nhắn',
    });
  }
};

const getContactMessageById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID tin nhắn không hợp lệ',
      });
    }

    const contactMessage = await ContactMessage.findByPk(id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn',
      });
    }

    return res.status(200).json({
      success: true,
      data: contactMessage,
    });
  } catch (error) {
    console.error('Get contact message error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin tin nhắn',
    });
  }
};

const updateContactMessageStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body || {};
    const allowedStatuses = ['new', 'read', 'replied'];

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID tin nhắn không hợp lệ',
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ',
      });
    }

    const contactMessage = await ContactMessage.findByPk(id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn',
      });
    }

    contactMessage.status = status;
    await contactMessage.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: contactMessage,
    });
  } catch (error) {
    console.error('Update contact status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái',
    });
  }
};

const deleteContactMessage = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID tin nhắn không hợp lệ',
      });
    }

    const contactMessage = await ContactMessage.findByPk(id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn',
      });
    }

    await contactMessage.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa tin nhắn thành công',
    });
  } catch (error) {
    console.error('Delete contact message error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa tin nhắn',
    });
  }
};

const replyToContactMessage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { message } = req.body || {};

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID tin nhắn không hợp lệ',
      });
    }

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung phản hồi',
      });
    }

    const contactMessage = await ContactMessage.findByPk(id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tin nhắn',
      });
    }

    await sendContactReplyEmail({
      to: contactMessage.email,
      customerName: contactMessage.name,
      subject: contactMessage.subject,
      message: message.trim(),
    });

    contactMessage.status = 'replied';
    await contactMessage.save();

    return res.status(200).json({
      success: true,
      message: 'Đã gửi phản hồi đến khách hàng',
      data: contactMessage,
    });
  } catch (error) {
    console.error('Reply contact message error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể gửi phản hồi đến khách hàng',
      error: error.message,
    });
  }
};

module.exports = {
  createContactMessage,
  getContactMessages,
  getContactMessageById,
  updateContactMessageStatus,
  deleteContactMessage,
  replyToContactMessage,
};
