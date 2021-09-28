import * as Joi from 'joi';

export const csrSubjectsSchema: Joi.ObjectSchema = Joi.object({
  commonName: Joi.string().allow(''),
  countryName: Joi.string().allow(''),
  stateName: Joi.string().allow(''),
  localityName: Joi.string().allow(''),
  organizationName: Joi.string().allow(''),
  organizationUnitName: Joi.string().allow(''),
}).unknown(true).allow({}, null);

export const encryptionSchema: Joi.ObjectSchema = Joi.object({
  algorithm: Joi.string().valid(
    'aes-128-cbc',
  ),
  iv: Joi.string().length(16).default('1234567890123456'),
  key: Joi.string().length(16).required(),
});