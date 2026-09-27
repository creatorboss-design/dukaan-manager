let stack = [];

export function pushModal(onClose) {
  stack.push(onClose);
}

export function popModal(onClose) {
  stack = stack.filter((fn) => fn !== onClose);
}

/** Closes the most-recently-opened modal, if any. Returns true if it did. */
export function closeTopModal() {
  if (stack.length === 0) return false;
  const top = stack[stack.length - 1];
  top();
  return true;
}

export function hasOpenModal() {
  return stack.length > 0;
}
