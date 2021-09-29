import * as Joi from 'joi';

export const csrSubjectsSchema: Joi.ObjectSchema = Joi.object({
  commonName: Joi.string().allow('', null),
  countryName: Joi.string().allow('', null),
  stateName: Joi.string().allow('', null),
  localityName: Joi.string().allow('', null),
  organizationName: Joi.string().allow('', null),
  organizationUnitName: Joi.string().allow('', null),
}).unknown(true).allow({}, null);

export const encryptionSchema: Joi.ObjectSchema = Joi.object({
  algorithm: Joi.string().valid(
    'aes-128-cbc',
  ),
  iv: Joi.string().length(16).default('1234567890123456'),
  key: Joi.string().length(16).required(),
});