const { Address } = require('../models');

const addressFields = [
  'recipient_name',
  'phone',
  'label',
  'address_line',
  'ward',
  'district',
  'city',
  'is_default',
];

const getAddressValues = (body) => {
  const source = body && typeof body === 'object' ? body : {};
  const values = {};

  for (const field of addressFields) {
    if (Object.hasOwn(source, field)) {
      values[field] = source[field];
    }
  }

  return values;
};

const validateAddress = (values, { partial = false } = {}) => {
  const requiredFields = [
    'recipient_name',
    'phone',
    'address_line',
    'ward',
    'district',
    'city',
  ];

  for (const field of requiredFields) {
    if (
      (!partial || Object.hasOwn(values, field)) &&
      (typeof values[field] !== 'string' || !values[field].trim())
    ) {
      return 'Vui lòng nhập đầy đủ thông tin người nhận và địa chỉ';
    }
  }

  if (
    Object.hasOwn(values, 'label') &&
    !['home', 'work', 'other'].includes(values.label)
  ) {
    return 'Loại địa chỉ không hợp lệ';
  }

  if (
    Object.hasOwn(values, 'is_default') &&
    typeof values.is_default !== 'boolean'
  ) {
    return 'Trạng thái địa chỉ mặc định không hợp lệ';
  }

  return null;
};

const getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { user_id: req.user.id },
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    return res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    console.error('Get addresses error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể lấy sổ địa chỉ',
    });
  }
};

const createAddress = async (req, res) => {
  const values = getAddressValues(req.body);
  const validationError = validateAddress(values);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  let transaction;

  try {
    transaction = await Address.sequelize.transaction();
    const addressCount = await Address.count({
      where: { user_id: req.user.id },
      transaction,
    });
    const shouldBeDefault = values.is_default === true || addressCount === 0;

    if (shouldBeDefault) {
      await Address.update(
        { is_default: false },
        { where: { user_id: req.user.id }, transaction },
      );
    }

    const address = await Address.create(
      {
        ...values,
        recipient_name: values.recipient_name.trim(),
        phone: values.phone.trim(),
        address_line: values.address_line.trim(),
        ward: values.ward.trim(),
        district: values.district.trim(),
        city: values.city.trim(),
        label: values.label || 'home',
        is_default: shouldBeDefault,
        user_id: req.user.id,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: 'Đã thêm địa chỉ',
      data: address,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Create address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể thêm địa chỉ',
    });
  }
};

const updateAddress = async (req, res) => {
  const values = getAddressValues(req.body);
  const validationError = validateAddress(values, { partial: true });

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  let transaction;

  try {
    transaction = await Address.sequelize.transaction();
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ',
      });
    }

    if (values.is_default === true) {
      await Address.update(
        { is_default: false },
        {
          where: { user_id: req.user.id },
          transaction,
        },
      );
    }

    for (const field of [
      'recipient_name',
      'phone',
      'address_line',
      'ward',
      'district',
      'city',
    ]) {
      if (typeof values[field] === 'string') {
        values[field] = values[field].trim();
      }
    }

    await address.update(values, { transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật địa chỉ',
      data: address,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Update address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật địa chỉ',
    });
  }
};

const deleteAddress = async (req, res) => {
  let transaction;

  try {
    transaction = await Address.sequelize.transaction();
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ',
      });
    }

    await address.destroy({ transaction });

    if (address.is_default) {
      const nextAddress = await Address.findOne({
        where: { user_id: req.user.id },
        order: [['created_at', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (nextAddress) {
        await nextAddress.update({ is_default: true }, { transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Đã xóa địa chỉ',
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Delete address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể xóa địa chỉ',
    });
  }
};

const setDefaultAddress = async (req, res) => {
  let transaction;

  try {
    transaction = await Address.sequelize.transaction();
    const address = await Address.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy địa chỉ',
      });
    }

    await Address.update(
      { is_default: false },
      { where: { user_id: req.user.id }, transaction },
    );
    await address.update({ is_default: true }, { transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Đã đặt làm địa chỉ mặc định',
      data: address,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Set default address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Không thể đặt địa chỉ mặc định',
    });
  }
};

module.exports = {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
