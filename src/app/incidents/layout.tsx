/**
 * Renders the list (`children`) and the intercepted-modal slot (`modal`)
 * side by side. The list is never unmounted when the modal opens, which
 * is what makes "return to the same list state" free instead of
 * something to engineer separately.
 */
export default function IncidentsLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
