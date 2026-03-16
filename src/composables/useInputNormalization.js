export function useInputNormalization() {
  const normalizeDigits = (value, maxLength) =>
    String(value ?? '').replace(/\D/g, '').slice(0, maxLength);

  const normalizeRefDigits = (targetRef, maxLength) => {
    targetRef.value = normalizeDigits(targetRef.value, maxLength);
  };

  const normalizeFieldDigits = (objectRef, fieldName, maxLength) => {
    objectRef.value[fieldName] = normalizeDigits(objectRef.value[fieldName], maxLength);
  };

  return {
    normalizeDigits,
    normalizeRefDigits,
    normalizeFieldDigits,
  };
}
