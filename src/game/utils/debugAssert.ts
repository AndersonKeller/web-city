

export function assert(assertionPassed: boolean, message: string) {
  // TODO: Less invasive reporting than an alert
  if (!assertionPassed) {
    alert(`Assertion failed: ${message}`);
  }
}
