export function createFieldErrorSetter(form: any) {
  return (field: string, message: string): void => {
    form.setFieldMeta(field, (prev: any) => ({
      ...prev,
      isTouched: true,
      errors: [{ message }],
      errorMap: { onSubmit: { message } },
    }));
  };
}
