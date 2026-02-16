import type { IField } from '@/lib/interfaces';

export type FieldMap = {
  title?: IField;
  description?: IField;
  members?: IField;
  startDate?: IField;
  dueDate?: IField;
  progress?: IField;
  list?: IField;
  labels?: IField;
  attachments?: IField;
  tasks?: IField;
  comments?: IField;
};
