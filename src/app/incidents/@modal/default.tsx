// Required for a parallel route slot: renders nothing when there is no
// intercepted route matched (i.e. most of the time — only /incidents/[id]
// navigated to *from within* /incidents fills this slot).
export default function Default() {
  return null;
}
