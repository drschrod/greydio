export const copyToClipboard = (
    peerId: string,
    setCopySuccess: (message: string) => void
  ) => {
    const link = `${window.location.origin}/stream?peerId=${peerId}`;
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopySuccess('Link copied!');
        setTimeout(() => setCopySuccess(''), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
      });
  };
  