import * as Joi from 'joi';

export const csrSubjectsSchema: Joi.ObjectSchema = Joi.object({
  commonName: Joi.string().allow(''),
  countryName: Joi.string().allow(''),
  stateName: Joi.string().allow(''),
  localityName: Joi.string().allow(''),
  organizationName: Joi.string().allow(''),
  organizationUnitName: Joi.string().allow(''),
}).unknown(true).allow({}, null);