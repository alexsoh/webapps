import type { ConverterInfo } from '../types';
import { jsonConverter } from './json';
import { powershellConverter } from './powershell';
import { sqlInConverter, sqlInsertConverter, sqlValuesConverter } from './sql';
import { markdownConverter } from './markdown';
import { yamlConverter } from './yaml';
import { pythonConverter } from './python';
import { bashConverter } from './bash';
import { zshConverter } from './zsh';
import { xmlConverter } from './xml';
import { dosConverter } from './dos';

export const converters: ConverterInfo[] = [
  jsonConverter,
  powershellConverter,
  sqlInConverter,
  sqlInsertConverter,
  sqlValuesConverter,
  markdownConverter,
  yamlConverter,
  pythonConverter,
  bashConverter,
  zshConverter,
  xmlConverter,
  dosConverter,
];
