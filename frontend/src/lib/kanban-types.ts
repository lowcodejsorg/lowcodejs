import type { IField } from '@/lib/interfaces';

export type FieldMap = {
  title?: IField;
  description?: IField;
  members?: IField;
  dueDate?: IField;
  progress?: IField;
  list?: IField;
  labels?: IField;
  tasks?: IField;
  comments?: IField;
};
