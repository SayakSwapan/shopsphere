export const openAuthModal = () => {
  window.dispatchEvent(
    new Event("open-auth-modal")
  );
};